import testContext from '@utils/testContext';
import {deleteProductTest} from '@commonTests/BO/catalog/product';
import {expect} from 'chai';

import {
  boDashboardPage,
  boLoginPage,
  boProductsPage,
  boProductsCreatePage,
  boProductsCreateTabDetailsPage,
  type BrowserContext,
  FakerProduct,
  foClassicProductPage,
  type Page,
  utilsFile,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_FO_classic_productPage_productPage_addFileCustomization';

describe('FO - Product page - Product page : Add a file customization', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  // Data to create standard product with 2 customizations
  const newProductData: FakerProduct = new FakerProduct({
    type: 'standard',
    quantity: 100,
    minimumQuantity: 1,
    status: true,
    customizations: [
      {
        label: 'Lorem ipsum',
        type: 'File',
        required: false,
      },
      {
        label: 'Lorem ipsumm',
        type: 'File',
        required: true,
      }],
  });

  describe('Create product with 2 customizations and check it in FO', async () => {
    // before and after functions
    before(async function () {
      browserContext = await utilsPlaywright.createBrowserContext(this.browser);
      page = await utilsPlaywright.newTab(browserContext);
      await utilsFile.generateImage('file_1.jpg');
      await utilsFile.generateImage('file_2.jpg');
    });

    after(async () => {
      await utilsPlaywright.closeBrowserContext(browserContext);
      await utilsFile.deleteFile('file_1.jpg');
      await utilsFile.deleteFile('file_2.jpg');
    });

    it('should login in BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'loginBO', baseContext);

      await boLoginPage.goTo(page, global.BO.URL);
      await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

      const pageTitle = await boDashboardPage.getPageTitle(page);
      expect(pageTitle).to.contains(boDashboardPage.pageTitle);
    });

    it('should go to \'Catalog > Products\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPage', baseContext);

      await boDashboardPage.goToSubMenu(
        page,
        boDashboardPage.catalogParentLink,
        boDashboardPage.productsLink,
      );

      await boProductsPage.closeSfToolBar(page);

      const pageTitle = await boProductsPage.getPageTitle(page);
      expect(pageTitle).to.contains(boProductsPage.pageTitle);
    });

    it('should click on \'New product\' button and check new product modal', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNewProductButton', baseContext);

      const isModalVisible = await boProductsPage.clickOnNewProductButton(page);
      expect(isModalVisible).to.eq(true);
    });

    it('should choose \'Standard product\' and go to new product page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'chooseStandardProduct', baseContext);

      await boProductsPage.selectProductType(page, newProductData.type);
      await boProductsPage.clickOnAddNewProduct(page);

      const pageTitle = await boProductsCreatePage.getPageTitle(page);
      expect(pageTitle).to.contains(boProductsCreatePage.pageTitle);
    });

    it('should create standard product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createStandardProduct', baseContext);

      const createProductMessage = await boProductsCreatePage.setProduct(page, newProductData);
      expect(createProductMessage).to.equal(boProductsCreatePage.successfulUpdateMessage);
    });

    it('should create 2 customizations', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createCustomizations', baseContext);

      await boProductsCreateTabDetailsPage.addNewCustomizations(page, newProductData);

      const message = await boProductsCreatePage.saveProduct(page);
      expect(message).to.eq(boProductsCreatePage.successfulUpdateMessage);
    });

    it('should preview product', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'previewProduct', baseContext);

      // Click on preview button
      page = await boProductsCreatePage.previewProduct(page);

      await foClassicProductPage.changeLanguage(page, 'en');

      const pageTitle = await foClassicProductPage.getPageTitle(page);
      expect(pageTitle).to.contains(newProductData.name);
    });

    it('should check the customization section', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkProductCustomizations', baseContext);

      const productCondition = await foClassicProductPage.isCustomizationBlockVisible(page);
      expect(productCondition).to.eq(true);
    });

    it('should check that add to card button is disabled', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkAddToCartButtonDisabled', baseContext);

      const isAddToCartButtonDisabled = await foClassicProductPage.isAddToCartButtonDisplayed(page);
      expect(isAddToCartButtonDisabled).to.equal(true);
    });

    it('should set the 2 customizations and save', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'setCustomizations', baseContext);

      await foClassicProductPage.setProductFileCustomizations(page, ['file_1.jpg', 'file_2.jpg']);

      const firstCustomImage = await foClassicProductPage.getCustomizationImage(page, 1);
      expect(firstCustomImage).to.contains('deletePicture');

      const secondCustomImage = await foClassicProductPage.getCustomizationImage(page, 2);
      expect(secondCustomImage).to.contains('deletePicture');
    });

    it('should check that add to card button is enabled', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkAddToCartButtonEnabled', baseContext);

      const isAddToCartButtonEnabled = await foClassicProductPage.isAddToCartButtonEnabled(page);
      expect(isAddToCartButtonEnabled).to.equal(true);
    });
  });

  // Post-condition: Delete specific price
  deleteProductTest(newProductData, `${baseContext}_postTest`);
});
