import testContext from '@utils/testContext';
import {expect} from 'chai';

import {
  boDashboardPage,
  boInvoicesPage,
  boLoginPage,
  boOrdersPage,
  boOrdersViewBlockTabListPage,
  type BrowserContext,
  dataOrderStatuses,
  type Page,
  utilsFile,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_orders_invoices_generateInvoiceByStatus';

// 1 : Generate PDF file by status
describe('BO - Orders - Invoices : Generate PDF file by status', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let filePath: string|null;

  // before and after functions
  before(async function () {
    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'loginBO', baseContext);

    await boLoginPage.goTo(page, global.BO.URL);
    await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

    const pageTitle = await boDashboardPage.getPageTitle(page);
    expect(pageTitle).to.contains(boDashboardPage.pageTitle);
  });

  describe('Create 2 invoices by changing the order status', async () => {
    [
      {args: {orderRow: 1, status: dataOrderStatuses.shipped.name}},
      {args: {orderRow: 2, status: dataOrderStatuses.paymentAccepted.name}},
    ].forEach((orderToEdit, index: number) => {
      it('should go to \'Orders > Orders\' page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToOrdersPage${index + 1}`, baseContext);

        await boDashboardPage.goToSubMenu(
          page,
          boDashboardPage.ordersParentLink,
          boDashboardPage.ordersLink,
        );
        await boOrdersPage.closeSfToolBar(page);

        const pageTitle = await boOrdersPage.getPageTitle(page);
        expect(pageTitle).to.contains(boOrdersPage.pageTitle);
      });

      it(`should go to the order page n°${orderToEdit.args.orderRow}`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToOrderPage${index + 1}`, baseContext);

        await boOrdersPage.goToOrder(page, orderToEdit.args.orderRow);

        const pageTitle = await boOrdersViewBlockTabListPage.getPageTitle(page);
        expect(pageTitle).to.contains(boOrdersViewBlockTabListPage.pageTitle);
      });

      it(`should change the order status to '${orderToEdit.args.status}' and check it`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `updateOrderStatus${index + 1}`, baseContext);

        const result = await boOrdersViewBlockTabListPage.modifyOrderStatus(page, orderToEdit.args.status);
        expect(result).to.equal(orderToEdit.args.status);
      });
    });
  });

  describe('Generate invoice by status', async () => {
    it('should go to \'Orders > Invoices\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToInvoicesPage', baseContext);

      await boOrdersViewBlockTabListPage.goToSubMenu(
        page,
        boOrdersViewBlockTabListPage.ordersParentLink,
        boOrdersViewBlockTabListPage.invoicesLink,
      );

      const pageTitle = await boInvoicesPage.getPageTitle(page);
      expect(pageTitle).to.contains(boInvoicesPage.pageTitle);
    });

    it('should check the error message when we don\'t select a status', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkNoSelectedStatusMessageError', baseContext);

      // Generate PDF
      const textMessage = await boInvoicesPage.generatePDFByStatusAndFail(page);
      expect(textMessage).to.equal(boInvoicesPage.errorMessageWhenNotSelectStatus);
    });

    it('should check the error message when there is no invoice in the status selected', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkNoInvoiceMessageError', baseContext);

      // Choose one status
      await boInvoicesPage.chooseStatus(page, dataOrderStatuses.canceled.name);

      // Generate PDF
      const textMessage = await boInvoicesPage.generatePDFByStatusAndFail(page);
      expect(textMessage).to.equal(boInvoicesPage.errorMessageWhenGenerateFileByStatus);
    });

    it('should choose the statuses, generate the invoice and check the file existence', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'selectStatusesAndCheckInvoiceExistence', baseContext);

      // Choose 2 statuses
      await boInvoicesPage.chooseStatus(page, dataOrderStatuses.paymentAccepted.name);
      await boInvoicesPage.chooseStatus(page, dataOrderStatuses.shipped.name);

      // Generate PDF
      filePath = await boInvoicesPage.generatePDFByStatusAndDownload(page);
      expect(filePath).to.not.eq(null);

      // Check that file exist
      if (filePath) {
        const exist = await utilsFile.doesFileExist(filePath);
        expect(exist).to.eq(true);
      }
    });

    it('should choose one status, generate the invoice and check the file existence', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'selectOneStatusAndCheckInvoiceExistence', baseContext);

      // Choose one status
      await boInvoicesPage.chooseStatus(page, dataOrderStatuses.paymentAccepted.name);

      // Generate PDF
      filePath = await boInvoicesPage.generatePDFByStatusAndDownload(page);
      expect(filePath).to.not.eq(null);

      // Check that file exist
      if (filePath) {
        const exist = await utilsFile.doesFileExist(filePath);
        expect(exist).to.eq(true);
      }
    });
  });
});
