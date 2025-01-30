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

namespace Tests\Integration\PrestaShopBundle\ApiPlatform;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\OpenApi;
use ArrayObject;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class CQRSOpenApiFactoryTest extends KernelTestCase
{
    /**
     * @dataProvider provideJsonSchemaFactoryCases
     */
    public function testJsonSchemaFactory(string $schemaDefinitionName, ArrayObject $expectedDefinition): void
    {
        /** @var OpenApiFactoryInterface $openApiFactory */
        $openApiFactory = $this->getContainer()->get(OpenApiFactoryInterface::class);
        /** @var OpenApi $openApi */
        $openApi = $openApiFactory->__invoke();
        $schemas = $openApi->getComponents()->getSchemas();
        $this->assertArrayHasKey($schemaDefinitionName, $schemas);

        /** @var ArrayObject $resourceDefinition */
        $resourceDefinition = $schemas[$schemaDefinitionName];
        $this->assertEquals($expectedDefinition, $resourceDefinition);
    }

    public static function provideJsonSchemaFactoryCases(): iterable
    {
        yield 'Product output is based on the ApiPlatform resource' => [
            'Product',
            new ArrayObject([
                'type' => 'object',
                'description' => '',
                'deprecated' => false,
                'properties' => [
                    'productId' => new ArrayObject([
                        'type' => 'integer',
                    ]),
                    'type' => new ArrayObject([
                        'type' => 'string',
                    ]),
                    'active' => new ArrayObject([
                        'type' => 'boolean',
                    ]),
                    'names' => new ArrayObject([
                        'type' => 'object',
                        'example' => [
                            'en-US' => 'value',
                            'fr-FR' => 'valeur',
                        ],
                    ]),
                    'descriptions' => new ArrayObject([
                        'type' => 'object',
                        'example' => [
                            'en-US' => 'value',
                            'fr-FR' => 'valeur',
                        ],
                    ]),
                    // Shop IDs are documented via an ApiProperty attribute
                    'shopIds' => new ArrayObject([
                        'type' => 'array',
                        'items' => ['type' => 'integer'],
                        'example' => [1, 3],
                    ]),
                ],
            ]),
        ];

        // First productType and shopId must use scalar type, not ShopId and ProductType Value Objects
        // Then shopID is removed because it's automatically feed from the context, and other fields are renamed to
        // match the API format from the Api Resource class naming
        yield 'Product input for creation based on AddProductCommand' => [
            'Product.AddProductCommand',
            new ArrayObject([
                'type' => 'object',
                'description' => '',
                'deprecated' => false,
                'properties' => [
                    'type' => new ArrayObject([
                        'type' => 'string',
                    ]),
                    'names' => new ArrayObject([
                        'type' => 'object',
                        'example' => [
                            'en-US' => 'value',
                            'fr-FR' => 'valeur',
                        ],
                    ]),
                ],
            ]),
        ];
    }

    /**
     * @dataProvider getExpectedTags
     */
    public function testPathTags(string $path, string $expectedMethod, array $expectedTags): void
    {
        /** @var OpenApiFactoryInterface $openApiFactory */
        $openApiFactory = $this->getContainer()->get(OpenApiFactoryInterface::class);
        /** @var OpenApi $openApi */
        $openApi = $openApiFactory->__invoke();
        $pathItem = $openApi->getPaths()->getPath($path);
        $this->assertNotNull($pathItem);

        $methodGetter = 'get' . ucfirst(strtolower($expectedMethod));
        /** @var Operation $operation */
        $operation = $pathItem->$methodGetter();
        $this->assertNotNull($operation);
        $this->assertEquals($expectedTags, $operation->getTags());
    }

    public function getExpectedTags(): iterable
    {
        yield 'product get endpoint keeps Product tag' => [
            '/product/{productId}',
            'get',
            ['Product'],
        ];

        yield 'product patch endpoint keeps Product tag' => [
            '/product/{productId}',
            'patch',
            ['Product'],
        ];

        yield 'product image get endpoint has Product tag instead of ProductImage' => [
            '/product/image/{imageId}',
            'get',
            ['Product'],
        ];

        yield 'api client get endpoint keeps ApiClient tag' => [
            '/api-client/{apiClientId}',
            'get',
            ['ApiClient'],
        ];

        yield 'api client list endpoint has ApiClient tag instead of ApiClientList' => [
            '/api-clients',
            'get',
            ['ApiClient'],
        ];
    }
}
