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

namespace PrestaShopBundle\Form\Admin\Catalog\Category;

use PrestaShop\PrestaShop\Core\ConfigurationInterface;
use PrestaShop\PrestaShop\Core\ConstraintValidator\Constraints\CleanHtml;
use PrestaShop\PrestaShop\Core\ConstraintValidator\Constraints\DefaultLanguage;
use PrestaShop\PrestaShop\Core\ConstraintValidator\Constraints\TypedRegex;
use PrestaShop\PrestaShop\Core\ConstraintValidator\TypedRegexValidator;
use PrestaShop\PrestaShop\Core\Domain\Category\CategorySettings;
use PrestaShop\PrestaShop\Core\Domain\Category\SeoSettings;
use PrestaShop\PrestaShop\Core\Feature\FeatureInterface;
use PrestaShopBundle\Form\Admin\Sell\Category\SEO\RedirectOptionType;
use PrestaShopBundle\Form\Admin\Type\CategorySeoPreviewType;
use PrestaShopBundle\Form\Admin\Type\FormattedTextareaType;
use PrestaShopBundle\Form\Admin\Type\ImageWithPreviewType;
use PrestaShopBundle\Form\Admin\Type\Material\MaterialChoiceTableType;
use PrestaShopBundle\Form\Admin\Type\ShopChoiceTreeType;
use PrestaShopBundle\Form\Admin\Type\SwitchType;
use PrestaShopBundle\Form\Admin\Type\TextWithRecommendedLengthType;
use PrestaShopBundle\Form\Admin\Type\TranslatableType;
use PrestaShopBundle\Form\Admin\Type\TranslatorAwareType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Class AbstractCategoryType.
 */
abstract class AbstractCategoryType extends TranslatorAwareType
{
    /**
     * @var array
     */
    private $customerGroupChoices;

    /**
     * @var FeatureInterface
     */
    private $multiStoreFeature;

    /**
     * @var ConfigurationInterface
     */
    protected $configuration;

    /**
     * @param TranslatorInterface $translator
     * @param array $locales
     * @param array $customerGroupChoices
     * @param FeatureInterface $multiStoreFeature
     * @param ConfigurationInterface $configuration
     */
    public function __construct(
        TranslatorInterface $translator,
        array $locales,
        array $customerGroupChoices,
        FeatureInterface $multiStoreFeature,
        ConfigurationInterface $configuration
    ) {
        parent::__construct($translator, $locales);

        $this->customerGroupChoices = $customerGroupChoices;
        $this->multiStoreFeature = $multiStoreFeature;
        $this->configuration = $configuration;
    }

    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $genericCharactersHint = $this->trans('Invalid characters: %s', 'Admin.Notifications.Info', [TypedRegexValidator::CATALOG_CHARS]);
        /* @var EditableCategory $editableCategory */
        $builder
            ->add('name', TranslatableType::class, [
                'label' => $this->trans('Name', 'Admin.Global'),
                'help' => $genericCharactersHint,
                'type' => TextType::class,
                'constraints' => [
                    new DefaultLanguage(),
                ],
                'options' => [
                    'attr' => [
                        'maxlength' => CategorySettings::MAX_TITLE_LENGTH,
                    ],
                    'constraints' => [
                        new TypedRegex([
                            'type' => TypedRegex::TYPE_CATALOG_NAME,
                        ]),
                        new Length([
                            'max' => CategorySettings::MAX_TITLE_LENGTH,
                            'maxMessage' => $this->trans(
                                'This field cannot be longer than %limit% characters.',
                                'Admin.Notifications.Error',
                                [
                                    '%limit%' => CategorySettings::MAX_TITLE_LENGTH,
                                ]
                            ),
                        ]),
                    ],
                ],
            ])
            ->add('description', TranslatableType::class, [
                'label' => $this->trans('Description', 'Admin.Global'),
                'help' => $genericCharactersHint,
                'type' => FormattedTextareaType::class,
                'required' => false,
                'options' => [
                    'limit' => FormattedTextareaType::LIMIT_MEDIUMTEXT_UTF8_MB4,
                    'constraints' => [
                        new CleanHtml([
                            'message' => $this->trans('This field is invalid', 'Admin.Notifications.Error'),
                        ]),
                    ],
                ],
            ])
            ->add('additional_description', TranslatableType::class, [
                'label' => $this->trans('Additional description', 'Admin.Catalog.Feature'),
                'help' => $this->trans('Text that is usually displayed after the product list on category page. It\'s a good place to put longer SEO related content.', 'Admin.Catalog.Help') . ' ' . $genericCharactersHint,
                'type' => FormattedTextareaType::class,
                'required' => false,
                'options' => [
                    'limit' => FormattedTextareaType::LIMIT_MEDIUMTEXT_UTF8_MB4,
                    'constraints' => [
                        new CleanHtml([
                            'message' => $this->trans('This field is invalid', 'Admin.Notifications.Error'),
                        ]),
                    ],
                ],
            ])
            ->add('active', SwitchType::class, [
                'label' => $this->trans('Enabled', 'Admin.Global'),
                'required' => false,
            ])
            ->add('cover_image', ImageWithPreviewType::class, [
                'label' => $this->trans('Category cover image', 'Admin.Catalog.Feature'),
                'help' => $this->trans('Category image that is usually displayed on the category page next to description, depending on your theme.', 'Admin.Catalog.Help'),
                'required' => false,
                'can_be_deleted' => true,
                'show_size' => true,
            ])
            ->add('thumbnail_image', ImageWithPreviewType::class, [
                'label' => $this->trans('Category thumbnail', 'Admin.Catalog.Feature'),
                'help' => $this->trans('Miniature image that is used when displaying subcategories. Could be also used in menus and other places, depending on your theme.', 'Admin.Catalog.Help'),
                'required' => false,
                'can_be_deleted' => true,
                'show_size' => true,
            ])
            ->add('seo_preview', CategorySeoPreviewType::class,
                [
                    'label' => $this->trans('SEO preview', 'Admin.Global'),
                    'required' => false,
                ]
            )
            ->add('meta_title', TranslatableType::class, [
                'label' => $this->trans('Meta title', 'Admin.Global'),
                'help' => $genericCharactersHint,
                'type' => TextWithRecommendedLengthType::class,
                'required' => false,
                'options' => [
                    'recommended_length' => SeoSettings::RECOMMENDED_TITLE_LENGTH,
                    'attr' => [
                        'maxlength' => SeoSettings::MAX_TITLE_LENGTH,
                        'placeholder' => $this->trans(
                            'To have a different title from the category name, enter it here.',
                            'Admin.Catalog.Help'
                        ),
                    ],
                    'constraints' => [
                        new TypedRegex([
                            'type' => TypedRegex::TYPE_GENERIC_NAME,
                        ]),
                        new Length([
                            'max' => SeoSettings::MAX_TITLE_LENGTH,
                            'maxMessage' => $this->trans(
                                'This field cannot be longer than %limit% characters',
                                'Admin.Notifications.Error',
                                [
                                    '%limit%' => SeoSettings::MAX_TITLE_LENGTH,
                                ]
                            ),
                        ]),
                    ],
                ],
            ])
            ->add('meta_description', TranslatableType::class, [
                'label' => $this->trans('Meta description', 'Admin.Global'),
                'help' => $genericCharactersHint,
                'required' => false,
                'type' => TextWithRecommendedLengthType::class,
                'options' => [
                    'required' => false,
                    'input_type' => 'textarea',
                    'recommended_length' => SeoSettings::RECOMMENDED_DESCRIPTION_LENGTH,
                    'attr' => [
                        'maxlength' => SeoSettings::MAX_DESCRIPTION_LENGTH,
                        'rows' => 3,
                        'placeholder' => $this->trans(
                            'To have a different description than your category summary in search results page, write it here.',
                            'Admin.Catalog.Help'
                        ),
                    ],
                    'constraints' => [
                        new TypedRegex([
                            'type' => TypedRegex::TYPE_GENERIC_NAME,
                        ]),
                        new Length([
                            'max' => SeoSettings::MAX_DESCRIPTION_LENGTH,
                            'maxMessage' => $this->trans(
                                'This field cannot be longer than %limit% characters',
                                'Admin.Notifications.Error',
                                [
                                    '%limit%' => SeoSettings::MAX_DESCRIPTION_LENGTH,
                                ]
                            ),
                        ]),
                    ],
                ],
            ])
            ->add('link_rewrite', TranslatableType::class, [
                'label' => $this->trans('Friendly URL', 'Admin.Global'),
                'help' => $this->trans('Allowed characters: letters, numbers, underscores (_) and hyphens (-). To allow more characters, enable the \'Accented URL\' feature in Shop Parameters > Traffic & SEO.', 'Admin.Catalog.Help'),
                'type' => TextType::class,
                'constraints' => [
                    new DefaultLanguage(),
                ],
                'options' => [
                    'attr' => [
                        'maxlength' => SeoSettings::MAX_LINK_REWRITE_LENGTH,
                    ],
                    'constraints' => [
                        new TypedRegex([
                            'type' => TypedRegex::TYPE_LINK_REWRITE,
                        ]),
                        new Length([
                            'max' => SeoSettings::MAX_LINK_REWRITE_LENGTH,
                            'maxMessage' => $this->trans(
                                'This field cannot be longer than %limit% characters.',
                                'Admin.Notifications.Error',
                                [
                                    '%limit%' => SeoSettings::MAX_LINK_REWRITE_LENGTH,
                                ]
                            ),
                        ]),
                    ],
                ],
            ])
            ->add('redirect_option', RedirectOptionType::class, [
                'id_category' => $options['id_category'] ?? 0,
                'isRootCategory' => $this instanceof RootCategoryType,
                'alert_message' => $this->getRedirectionAlertMessages(),
            ])
            ->add('group_association', MaterialChoiceTableType::class, [
                'label' => $this->trans('Group access', 'Admin.Catalog.Feature'),
                'help' => $this->trans('Select the customer groups which will have access to this category.', 'Admin.Catalog.Help'),
                'choices' => $this->customerGroupChoices,
                'required' => true,
                'constraints' => [
                    new NotBlank([
                        'message' => $this->trans('This field cannot be empty.', 'Admin.Notifications.Error'),
                    ]),
                ],
            ]);

        if ($this->multiStoreFeature->isUsed()) {
            $builder->add('shop_association', ShopChoiceTreeType::class, [
                'label' => $this->trans('Store association', 'Admin.Global'),
            ]);
        }
    }

    private function getRedirectionAlertMessages(): array
    {
        $formatParameters = [
            '[1]' => '<strong>',
            '[/1]' => '</strong>',
            '[2]' => '<br>',
        ];

        $alertMessages = [
            $this->trans('[1]No redirection (404), display error page[/1] [2] Do not redirect anywhere and display a 404 "Not Found" page.', 'Admin.Catalog.Help', $formatParameters),
            $this->trans('[1]No redirection (410), display error page[/1] [2] Do not redirect anywhere and display a 410 "Gone" page.', 'Admin.Catalog.Help', $formatParameters),
        ];

        if (!$this instanceof RootCategoryType) {
            $alertMessages = array_merge([
                $this->trans('[1]Permanent redirection (301)[/1] [2] Permanently display another category instead.', 'Admin.Catalog.Help', $formatParameters),
                $this->trans('[1]Temporary redirection (302)[/1] [2] Temporarily display another category instead.', 'Admin.Catalog.Help', $formatParameters),
            ], $alertMessages);
        }

        return $alertMessages;
    }
}
