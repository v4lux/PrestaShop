import testContext from '@utils/testContext';
import {expect} from 'chai';

import {
  boDashboardPage,
  boLoginPage,
  boMerchandiseReturnsPage,
  boOrdersPage,
  boOrdersViewBasePage,
  type BrowserContext,
  dataCustomers,
  dataOrderStatuses,
  dataPaymentMethods,
  foClassicCartPage,
  foClassicCheckoutPage,
  foClassicCheckoutOrderConfirmationPage,
  foClassicHomePage,
  foClassicLoginPage,
  foClassicMyAccountPage,
  foClassicMyMerchandiseReturnsPage,
  foClassicMyOrderDetailsPage,
  foClassicMyOrderHistoryPage,
  foClassicProductPage,
  type Page,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_customerService_merchandiseReturns_merchandiseReturnOptions';

/*
Pre-condition:
- Create order in FO
Scenario:
- Activate/Deactivate merchandise return
- Update returns prefix
- Change the first order status in the list to shipped
- Check the existence of the button return products
- Go to FO>My account>Order history> first order detail in the list
- Check the existence of product return form
- Create a merchandise returns then check the file prefix
 */
describe('BO - Customer Service - Merchandise Returns : Merchandise return (RMA) options', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  // before and after functions
  before(async function () {
    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  describe('PRE-TEST: Create order in FO', async () => {
    it('should go to FO page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToFO', baseContext);

      // Go to FO and change language
      await foClassicHomePage.goToFo(page);
      await foClassicHomePage.changeLanguage(page, 'en');

      const isHomePage = await foClassicHomePage.isHomePage(page);
      expect(isHomePage, 'Fail to open FO home page').to.eq(true);
    });

    it('should go to login page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToLoginPageFO', baseContext);

      await foClassicHomePage.goToLoginPage(page);

      const pageTitle = await foClassicLoginPage.getPageTitle(page);
      expect(pageTitle, 'Fail to open FO login page').to.contains(foClassicLoginPage.pageTitle);
    });

    it('should sign in with default customer', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'sighInFO', baseContext);

      await foClassicLoginPage.customerLogin(page, dataCustomers.johnDoe);

      const isCustomerConnected = await foClassicLoginPage.isCustomerConnected(page);
      expect(isCustomerConnected, 'Customer is not connected').to.eq(true);
    });

    it('should add product to cart', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'addProductToCart', baseContext);

      // Go to home page
      await foClassicLoginPage.goToHomePage(page);
      // Go to the first product page
      await foClassicHomePage.goToProductPage(page, 1);
      // Add the product to the cart
      await foClassicProductPage.addProductToTheCart(page);

      const notificationsNumber = await foClassicCartPage.getCartNotificationsNumber(page);
      expect(notificationsNumber).to.be.equal(1);
    });

    it('should go to delivery step', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToDeliveryStep', baseContext);

      // Proceed to checkout the shopping cart
      await foClassicCartPage.clickOnProceedToCheckout(page);

      // Address step - Go to delivery step
      const isStepAddressComplete = await foClassicCheckoutPage.goToDeliveryStep(page);
      expect(isStepAddressComplete, 'Step Address is not complete').to.eq(true);
    });

    it('should go to payment step', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToPaymentStep', baseContext);

      // Delivery step - Go to payment step
      const isStepDeliveryComplete = await foClassicCheckoutPage.goToPaymentStep(page);
      expect(isStepDeliveryComplete, 'Step Address is not complete').to.eq(true);
    });

    it('should choose payment method and confirm the order', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'confirmOrder', baseContext);

      // Payment step - Choose payment step
      await foClassicCheckoutPage.choosePaymentAndOrder(page, dataPaymentMethods.wirePayment.moduleName);

      // Check the confirmation message
      const cardTitle = await foClassicCheckoutOrderConfirmationPage.getOrderConfirmationCardTitle(page);
      expect(cardTitle).to.contains(foClassicCheckoutOrderConfirmationPage.orderConfirmationCardTitle);
    });

    it('should sign out from FO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'sighOutFO', baseContext);

      await foClassicCheckoutOrderConfirmationPage.logout(page);

      const isCustomerConnected = await foClassicCheckoutOrderConfirmationPage.isCustomerConnected(page);
      expect(isCustomerConnected, 'Customer is connected').to.eq(false);
    });
  });

  describe('BO : Enable/Disable and update the prefix', async () => {
    it('should login in BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'loginBO', baseContext);

      await boLoginPage.goTo(page, global.BO.URL);
      await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

      const pageTitle = await boDashboardPage.getPageTitle(page);
      expect(pageTitle).to.contains(boDashboardPage.pageTitle);
    });

    [
      {args: {action: 'activate', enable: true, prefix: '#NE'}},
      {args: {action: 'deactivate', enable: false, prefix: '#RE'}},
    ].forEach((test, index: number) => {
      it('should go to \'Customer Service > Merchandise Returns\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToMerchandiseReturnsPage${index}`, baseContext);

        await boDashboardPage.goToSubMenu(
          page,
          boDashboardPage.customerServiceParentLink,
          boDashboardPage.merchandiseReturnsLink,
        );
        await boMerchandiseReturnsPage.closeSfToolBar(page);

        const pageTitle = await boMerchandiseReturnsPage.getPageTitle(page);
        expect(pageTitle).to.contains(boMerchandiseReturnsPage.pageTitle);
      });

      it(`should ${test.args.action} merchandise returns`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.action}Returns`, baseContext);

        const result = await boMerchandiseReturnsPage.setOrderReturnStatus(page, test.args.enable);
        expect(result).to.contains(boMerchandiseReturnsPage.successfulUpdateMessage);
      });

      it('should update Returns prefix', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `updateReturnPrefix${index}`, baseContext);

        const result = await boMerchandiseReturnsPage.setReturnsPrefix(page, test.args.prefix);
        expect(result).to.contains(boMerchandiseReturnsPage.successfulUpdateMessage);
      });

      it('should go to \'Orders > Orders\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToOrdersPage${index}`, baseContext);

        await boDashboardPage.goToSubMenu(
          page,
          boDashboardPage.ordersParentLink,
          boDashboardPage.ordersLink,
        );

        const pageTitle = await boOrdersPage.getPageTitle(page);
        expect(pageTitle).to.contains(boOrdersPage.pageTitle);
      });

      it('should filter the Orders table by the default customer and check the result', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `filterOrder${index}`, baseContext);

        await boOrdersPage.filterOrders(page, 'input', 'customer', dataCustomers.johnDoe.lastName);

        const textColumn = await boOrdersPage.getTextColumn(page, 'customer', 1);
        expect(textColumn).to.contains(dataCustomers.johnDoe.lastName);
      });

      it('should go to the first order page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToOrderPage${index}`, baseContext);

        // View order
        await boOrdersPage.goToOrder(page, 1);

        const pageTitle = await boOrdersViewBasePage.getPageTitle(page);
        expect(pageTitle).to.contains(boOrdersViewBasePage.pageTitle);
      });

      it(`should change the order status to '${dataOrderStatuses.shipped.name}' and check it`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `updateOrderStatus${index}`, baseContext);

        const result = await boOrdersViewBasePage.modifyOrderStatus(page, dataOrderStatuses.shipped.name);
        expect(result).to.equal(dataOrderStatuses.shipped.name);
      });

      it('should check if the button \'Return products\' is visible', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `checkReturnProductsButton${index}`, baseContext);

        const result = await boOrdersViewBasePage.isReturnProductsButtonVisible(page);
        expect(result).to.equal(test.args.enable);
      });

      it('should go to FO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToFO${index}`, baseContext);

        // Click on view my shop
        page = await boOrdersViewBasePage.viewMyShop(page);
        // Change FO language
        await foClassicHomePage.changeLanguage(page, 'en');

        const isHomePage = await foClassicHomePage.isHomePage(page);
        expect(isHomePage, 'Home page is not displayed').to.eq(true);
      });

      // Go to My account page by login the first time and click on account link the second time
      if (index === 0) {
        it('should login', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToAccountPage${index}`, baseContext);

          await foClassicHomePage.goToLoginPage(page);
          await foClassicLoginPage.customerLogin(page, dataCustomers.johnDoe);

          const isCustomerConnected = await foClassicLoginPage.isCustomerConnected(page);
          expect(isCustomerConnected).to.eq(true);

          await foClassicHomePage.goToMyAccountPage(page);

          const pageTitle = await foClassicMyAccountPage.getPageTitle(page);
          expect(pageTitle).to.contains(foClassicMyAccountPage.pageTitle);
        });
      } else {
        it('should go to account page', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `goToAccountPage${index}`, baseContext);

          await foClassicHomePage.goToMyAccountPage(page);

          const pageTitle = await foClassicMyAccountPage.getPageTitle(page);
          expect(pageTitle).to.contains(foClassicMyAccountPage.pageTitle);
        });
      }

      it('should go to \'Order history and details\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToOrderHistoryPage${index}`, baseContext);

        await foClassicMyAccountPage.goToHistoryAndDetailsPage(page);

        const pageTitle = await foClassicMyOrderHistoryPage.getPageTitle(page);
        expect(pageTitle).to.contains(foClassicMyOrderHistoryPage.pageTitle);
      });

      it('should go to the first order in the list and check the existence of order return form', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `isOrderReturnFormVisible${index}`, baseContext);

        await foClassicMyOrderHistoryPage.goToDetailsPage(page, 1);

        const result = await foClassicMyOrderDetailsPage.isOrderReturnFormVisible(page);
        expect(result).to.equal(test.args.enable);
      });
      if (test.args.enable) {
        it('should create a merchandise return', async function () {
          await testContext.addContextItem(this, 'testIdentifier', 'createMerchandiseReturn', baseContext);

          await foClassicMyOrderDetailsPage.requestMerchandiseReturn(page, 'test');

          const pageTitle = await foClassicMyMerchandiseReturnsPage.getPageTitle(page);
          expect(pageTitle).to.contains(foClassicMyMerchandiseReturnsPage.pageTitle);
        });

        it('should verify order return prefix', async function () {
          await testContext.addContextItem(this, 'testIdentifier', 'checkOrderReturnPrefix', baseContext);

          const fileName = await foClassicMyMerchandiseReturnsPage.getTextColumn(page, 'fileName');
          expect(fileName).to.contains(test.args.prefix);
        });
      }

      it('should close the FO page and go back to BO', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `closeFoAndGoBackToBO${index}`, baseContext);

        page = await foClassicMyOrderDetailsPage.closePage(browserContext, page, 0);

        const pageTitle = await boOrdersViewBasePage.getPageTitle(page);
        expect(pageTitle).to.contains(boOrdersViewBasePage.pageTitle);
      });
    });
  });
});
