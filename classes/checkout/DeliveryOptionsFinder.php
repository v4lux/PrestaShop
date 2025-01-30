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

use PrestaShop\PrestaShop\Adapter\Presenter\Object\ObjectPresenter;
use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;
use Symfony\Contracts\Translation\TranslatorInterface;

class DeliveryOptionsFinderCore
{
    private $context;
    private $objectPresenter;
    private $translator;
    private $priceFormatter;

    public function __construct(
        Context $context,
        TranslatorInterface $translator,
        ObjectPresenter $objectPresenter,
        PriceFormatter $priceFormatter
    ) {
        $this->context = $context;
        $this->objectPresenter = $objectPresenter;
        $this->translator = $translator;
        $this->priceFormatter = $priceFormatter;
    }

    private function isFreeShipping(array $deliveryOption)
    {
        if ($deliveryOption['is_free']) {
            return true;
        }

        $cart = $this->context->cart;

        foreach ($cart->getCartRules() as $rule) {
            if ($rule['free_shipping'] && !$rule['carrier_restriction']) {
                return true;
                break;
            }
        }

        return false;
    }

    public function getSelectedDeliveryOption()
    {
        return current($this->context->cart->getDeliveryOption(null, false, false));
    }

    public function getDeliveryOptions()
    {
        $deliveryOptions = $this->context->cart->getDeliveryOptionList();
        $currentAddressDeliveryOptions = $deliveryOptions[$this->context->cart->id_address_delivery];

        if (empty($deliveryOptions[$this->context->cart->id_address_delivery])) {
            return [];
        }

        $formattedDeliveryOptions = [];

        foreach ($currentAddressDeliveryOptions as $deliveryOptionId => $deliveryOption) {
            $formattedDeliveryOption = end($deliveryOption['carrier_list']);
            $formattedDeliveryOption = array_merge($formattedDeliveryOption, $this->objectPresenter->present($formattedDeliveryOption['instance']));
            unset($formattedDeliveryOption['instance']);

            $carriersDetails = $this->getCarriersDetails($deliveryOption);
            $formattedDeliveryOption = array_merge($formattedDeliveryOption, $carriersDetails);

            $formattedDeliveryOption['price'] = $this->getPriceToDisplay($deliveryOption);
            $formattedDeliveryOption['label'] = $formattedDeliveryOption['price'];

            $formattedDeliveryOptions[$deliveryOptionId] = $formattedDeliveryOption;
        }

        return $formattedDeliveryOptions;
    }

    private function getCarriersDetails($deliveryOption)
    {
        $carriers = $deliveryOption['carrier_list'];

        if (count($carriers) === 1) {
            return [
                'id' => $carriers[0]['instance']->id,
                'label' => $carriers[0]['label'],
                'name' => $carriers[0]['instance']->name,
                'delay' => $carriers[0]['instance']->delay[$this->context->language->id],
            ];
        }

        $names = [];
        $delays = [];
        $extraContent = [];

        foreach ($carriers as $carrier) {
            $names[] = $carrier['instance']->name;
            $delays[] = $carrier['instance']->delay[$this->context->language->id];
            $extraContent[$carrier['instance']->id] = Hook::exec('displayCarrierExtraContent', ['carrier' => $carrier['instance']], Module::getModuleIdByName($carrier['instance']->id));
        }

        return [
            'id' => end($carriers)['instance']->id,
            'name' => implode(', ', $names),
            'delay' => implode(', ', $delays),
            'extraContent' => $extraContent,
        ];
    }

    private function getPriceToDisplay($deliveryOption)
    {
        if ($this->isFreeShipping($deliveryOption)) {
            return $this->translator->trans(
                'Free',
                [],
                'Shop.Theme.Checkout'
            );
        }

        if ($this->shouldIncludeTaxes()) {
            $price = $this->priceFormatter->format($deliveryOption['total_price_with_tax']);
            if ($this->shouldDisplayTaxesLabel()) {
                $label = '%price% tax incl.';
            }
        } else {
            $price = $this->priceFormatter->format($deliveryOption['total_price_without_tax']);
            if ($this->shouldDisplayTaxesLabel()) {
                $label = '%price% tax excl.';
            }
        }

        return $this->translator->trans(
            $label ?? '%price%',
            ['%price%' => $price],
            'Shop.Theme.Checkout'
        );
    }

    private function shouldIncludeTaxes()
    {
        return !Product::getTaxCalculationMethod((int) $this->context->cart->id_customer)
            && (int) Configuration::get('PS_TAX');
    }

    private function shouldDisplayTaxesLabel()
    {
        return Configuration::get('PS_TAX')
            && $this->context->country->display_tax_label
            && !Configuration::get('AEUC_LABEL_TAX_INC_EXC');
    }
}
