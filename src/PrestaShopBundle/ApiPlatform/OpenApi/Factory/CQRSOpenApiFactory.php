<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

namespace PrestaShopBundle\ApiPlatform\OpenApi\Factory;

use ApiPlatform\JsonSchema\DefinitionNameFactoryInterface;
use ApiPlatform\JsonSchema\ResourceMetadataTrait;
use ApiPlatform\JsonSchema\Schema;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\HttpOperation;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Resource\Factory\ResourceMetadataCollectionFactoryInterface;
use ApiPlatform\Metadata\Resource\Factory\ResourceNameCollectionFactoryInterface;
use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model\Operation as OpenApiOperation;
use ApiPlatform\OpenApi\Model\PathItem;
use ApiPlatform\OpenApi\Model\Paths;
use ApiPlatform\OpenApi\OpenApi;
use ArrayObject;
use PrestaShopBundle\ApiPlatform\Metadata\LocalizedValue;
use Symfony\Component\PropertyAccess\PropertyAccess;
use Symfony\Component\PropertyAccess\PropertyAccessorInterface;
use Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactoryInterface;

/**
 * This service decorates the main service that builds the Open API schema. It waits for the whole generation
 * to be done so that all types, schemas and example are correctly extracted. Then it applies the custom mapping,
 * when defined, so that the schema reflects the expected format for the API not the one in the domain logic from
 * CQRS commands.
 */
class CQRSOpenApiFactory implements OpenApiFactoryInterface
{
    use ResourceMetadataTrait;

    protected PropertyAccessorInterface $propertyAccessor;

    public function __construct(
        protected readonly OpenApiFactoryInterface $decorated,
        protected readonly ResourceNameCollectionFactoryInterface $resourceNameCollectionFactory,
        protected readonly DefinitionNameFactoryInterface $definitionNameFactory,
        protected readonly ClassMetadataFactoryInterface $classMetadataFactory,
        // No property promotion for this one since it's already defined in the ResourceMetadataTrait
        ResourceMetadataCollectionFactoryInterface $resourceMetadataFactory,
    ) {
        $this->resourceMetadataFactory = $resourceMetadataFactory;
        $this->propertyAccessor = PropertyAccess::createPropertyAccessorBuilder()
            ->disableExceptionOnInvalidIndex()
            ->disableExceptionOnInvalidPropertyPath()
            ->getPropertyAccessor()
        ;
    }

    public function __invoke(array $context = []): OpenApi
    {
        $parentOpenApi = $this->decorated->__invoke($context);

        $domainsByUri = [];
        foreach ($this->resourceNameCollectionFactory->create() as $resourceClass) {
            $resourceMetadataCollection = $this->resourceMetadataFactory->create($resourceClass);

            foreach ($resourceMetadataCollection as $resourceMetadata) {
                $resourceDefinitionName = $this->definitionNameFactory->create($resourceMetadata->getClass());

                // Adapt localized value schema for API resource schema (mostly for read schema)
                if ($parentOpenApi->getComponents()->getSchemas()->offsetExists($resourceDefinitionName)) {
                    $this->adaptLocalizedValues($resourceMetadata, $parentOpenApi->getComponents()->getSchemas()->offsetGet($resourceDefinitionName));
                }

                /** @var Operation $operation */
                foreach ($resourceMetadata->getOperations() as $operation) {
                    // For each URI define the expected domain (we want to avoid splitting domains because they are based on multiple API resource classes)
                    if ($operation instanceof HttpOperation && !empty($operation->getUriTemplate())) {
                        $operationDomain = $this->getOperationDomain($operation);
                        if (!empty($operationDomain) && empty($domainsByUri[$operation->getUriTemplate()])) {
                            $domainsByUri[$operation->getUriTemplate()] = $this->getOperationDomain($operation);
                        }
                    }

                    if (empty($operation->getExtraProperties()['CQRSCommand'])) {
                        continue;
                    }

                    $inputClass = $this->findOutputClass($operation->getClass(), Schema::TYPE_INPUT, $operation, []);
                    if (null === $inputClass) {
                        continue;
                    }

                    // Build the operation name like SchemaFactory does so that we have the proper definition in the schema matching this operation
                    $operationSchemaDefinitionName = $this->definitionNameFactory->create($operation->getClass(), 'json', $inputClass, $operation, []);
                    if (!$parentOpenApi->getComponents()->getSchemas()->offsetExists($operationSchemaDefinitionName)) {
                        continue;
                    }

                    /** @var ArrayObject $definition */
                    $definition = $parentOpenApi->getComponents()->getSchemas()->offsetGet($operationSchemaDefinitionName);
                    if (empty($definition['properties'])) {
                        continue;
                    }

                    $this->applyCommandMapping($operation, $definition);
                    if ($resourceMetadata instanceof ApiResource) {
                        // Adapt localized value schema for operation definition (for valid input example)
                        $this->adaptLocalizedValues($resourceMetadata, $definition);
                    }
                }
            }
        }

        $updatedPaths = new Paths();
        /** @var PathItem $pathItem */
        foreach ($parentOpenApi->getPaths()->getPaths() as $path => $pathItem) {
            // Get operations that are defined (not null)
            $operations = array_filter([
                'withGet' => $pathItem->getGet(),
                'withPost' => $pathItem->getPost(),
                'withPut' => $pathItem->getPut(),
                'withPatch' => $pathItem->getPatch(),
                'withDelete' => $pathItem->getDelete(),
            ], fn ($operation) => null !== $operation);

            if (!empty($operations) && !empty($domainsByUri[$path])) {
                $updatedPathItem = $pathItem;
                /** @var OpenApiOperation $operation */
                foreach ($operations as $setterMethod => $operation) {
                    $taggedOperation = $operation->withTags([$domainsByUri[$path]]);
                    $updatedPathItem = $updatedPathItem->$setterMethod($taggedOperation);
                }
                $updatedPaths->addPath($path, $updatedPathItem);
            } else {
                $updatedPaths->addPath($path, $pathItem);
            }
        }

        $updatedOpenApi = new OpenApi(
            $parentOpenApi->getInfo(),
            $parentOpenApi->getServers(),
            $updatedPaths,
            $parentOpenApi->getComponents(),
            $parentOpenApi->getSecurity(),
            $parentOpenApi->getTags(),
            $parentOpenApi->getExternalDocs(),
            $parentOpenApi->getJsonSchemaDialect(),
            $parentOpenApi->getWebhooks(),
        );

        return $updatedOpenApi;
    }

    /**
     * Deduce the domain from the FQCN, for classes that are at the root of ApiPlatform\Resources the class name is used,
     * but if the domain was placed in a subspace with multiple classes in it we use the last sub namespace.
     *
     * ex:
     *      PrestaShopBundle\ApiPlatform\Resources\ApiClient => ApiClient
     *      PrestaShop\Module\APIResources\ApiPlatform\Resources\ApiClient\ApiClient => ApiClient
     *      PrestaShop\Module\APIResources\ApiPlatform\Resources\ApiClient\ApiClientList => ApiClient
     *      PrestaShop\Module\APIResources\ApiPlatform\Resources\Product\Product => Product
     *      PrestaShop\Module\APIResources\ApiPlatform\Resources\Product\ProductList => Product
     *
     * @param HttpOperation $operation
     *
     * @return string|null
     */
    protected function getOperationDomain(HttpOperation $operation): ?string
    {
        // All our domain API resources (in the core and in the module) are in a sub namespace ending with ApiPlatform\Resources
        if (!str_contains($operation->getClass(), 'ApiPlatform\Resources\\')) {
            return null;
        }

        // Get the last part of the FQCN after ApiPlatform\Resources
        $domainEnd = substr($operation->getClass(), strrpos($operation->getClass(), 'ApiPlatform\Resources\\') + strlen('ApiPlatform\Resources\\'));
        if (empty($domainEnd)) {
            return null;
        }

        // If the remaining part is only the class name we can use it for the domain
        if (!str_contains($domainEnd, '\\')) {
            return $domainEnd;
        }

        // If not we use the last namespace
        $splitDomain = explode('\\', $domainEnd);

        return $splitDomain[count($splitDomain) - 2];
    }

    protected function adaptLocalizedValues(ApiResource $apiResource, ArrayObject $definition): void
    {
        if (empty($definition['properties'])) {
            return;
        }

        $resourceClassMetadata = $this->classMetadataFactory->getMetadataFor($apiResource->getClass());
        $resourceReflectionClass = $resourceClassMetadata->getReflectionClass();

        foreach ($definition['properties'] as $propertyName => $propertySchema) {
            if (!$resourceReflectionClass->hasProperty($propertyName)) {
                continue;
            }

            $property = $resourceReflectionClass->getProperty($propertyName);
            foreach ($property->getAttributes() as $attribute) {
                // Adapt the schema of localized values, they must be an object index by the Language's locale (not an array)
                if ($attribute->getName() === LocalizedValue::class || is_subclass_of($attribute->getName(), LocalizedValue::class)) {
                    $definition['properties'][$propertyName]['type'] = 'object';
                    $definition['properties'][$propertyName]['example'] = [
                        'en-US' => 'value',
                        'fr-FR' => 'valeur',
                    ];
                    unset($definition['properties'][$propertyName]['items']);
                }
            }
        }
    }

    protected function applyCommandMapping(Operation $operation, ArrayObject $definition): void
    {
        if (empty($operation->getExtraProperties()['CQRSCommandMapping'])) {
            return;
        }

        foreach ($operation->getExtraProperties()['CQRSCommandMapping'] as $apiPath => $cqrsPath) {
            // Replace properties that are scanned from CQRS command to their expected API path
            if ($this->propertyAccessor->isReadable($definition['properties'], $cqrsPath)) {
                // Automatic value from context are simply removed from the schema, the others are "moved" to match the expected property path
                if (!str_starts_with($apiPath, '[_context]') && $this->propertyAccessor->isWritable($definition['properties'], $apiPath)) {
                    $this->propertyAccessor->setValue($definition['properties'], $apiPath, $this->propertyAccessor->getValue($definition['properties'], $cqrsPath));
                }

                // Use property path to set null, the null values will then be cleaned in a second loop (because unset cannot use property path as an input)
                if ($this->propertyAccessor->isWritable($definition['properties'], $cqrsPath)) {
                    $this->propertyAccessor->setValue($definition['properties'], $cqrsPath, null);
                }
            }
        }

        // Now clean the values that were set to null by the previous loop
        foreach ($definition['properties'] as $propertyName => $propertyValue) {
            if (null === $propertyValue) {
                unset($definition['properties'][$propertyName]);
            }
        }
    }
}
