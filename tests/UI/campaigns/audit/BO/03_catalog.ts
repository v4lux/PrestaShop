import {expect} from 'chai';
import addBrandPage from '@pages/BO/catalog/brands/add';
import addBrandAddressPage from '@pages/BO/catalog/brands/addAddress';
import viewBrandPage from '@pages/BO/catalog/brands/view';
import addFilePage from '@pages/BO/catalog/files/add';
import suppliersPage from '@pages/BO/catalog/suppliers';
import viewSupplierPage from '@pages/BO/catalog/suppliers/view';
import testContext from '@utils/testContext';

import {
  boAttributesPage,
  boAttributesCreatePage,
  boAttributesValueCreatePage,
  boAttributesViewPage,
  boBrandsPage,
  boCartRulesPage,
  boCartRulesCreatePage,
  boCatalogPriceRulesPage,
  boCatalogPriceRulesCreatePage,
  boCategoriesPage,
  boCategoriesCreatePage,
  boDashboardPage,
  boFeaturesPage,
  boFeaturesCreatePage,
  boFeaturesValueCreatePage,
  boFeaturesViewPage,
  boFilesPage,
  boLoginPage,
  boMonitoringPage,
  boProductsPage,
  boProductsCreatePage,
  boStockPage,
  boStockMovementsPage,
  boSuppliersCreate,
  type BrowserContext,
  dataAttributes,
  dataCategories,
  dataFeatures,
  dataSuppliers,
  type Page,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'audit_BO_catalog';

describe('BO - Catalog', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  before(async function () {
    utilsPlaywright.setErrorsCaptured(true);

    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  beforeEach(async () => {
    utilsPlaywright.resetJsErrors();
  });

  it('should login in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'loginBO', baseContext);

    await boLoginPage.goTo(page, global.BO.URL);
    await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

    const pageTitle = await boDashboardPage.getPageTitle(page);
    expect(pageTitle).to.contains(boDashboardPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Products\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPage', baseContext);

    await boDashboardPage.goToSubMenu(page, boDashboardPage.catalogParentLink, boDashboardPage.productsLink);

    const pageTitle = await boProductsPage.getPageTitle(page);
    expect(pageTitle).to.contains(boProductsPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Products > Product\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductPage', baseContext);

    await boProductsPage.goToProductPage(page, 1);

    const pageTitle: string = await boProductsCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boProductsCreatePage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Products > Add new product\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewProductPage', baseContext);

    await boDashboardPage.goToSubMenu(page, boDashboardPage.catalogParentLink, boDashboardPage.productsLink);

    const isModalVisible = await boProductsPage.clickOnNewProductButton(page);
    expect(isModalVisible).to.eq(true);

    await boProductsPage.selectProductType(page, 'standard');
    await boProductsPage.clickOnAddNewProduct(page);

    const pageTitle = await boProductsCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boProductsCreatePage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Categories\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCategoriesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.categoriesLink,
    );

    const pageTitle = await boCategoriesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boCategoriesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Categories > Category\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCategoryPage', baseContext);

    await boCategoriesPage.goToEditCategoryPage(page, 1);

    const pageTitle = await boCategoriesCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(dataCategories.clothes.name);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Categories > Add new category\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewCategoryPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.categoriesLink,
    );

    await boCategoriesPage.goToAddNewCategoryPage(page);

    const pageTitle = await boCategoriesCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boCategoriesCreatePage.pageTitleCreate);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Monitoring\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToMonitoringPage', baseContext);

    await boCategoriesPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.monitoringLink,
    );

    const pageTitle = await boMonitoringPage.getPageTitle(page);
    expect(pageTitle).to.contains(boMonitoringPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Attributes\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAttributesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );

    const pageTitle = await boAttributesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boAttributesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Attributes > Attribute\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAttributePage', baseContext);

    await boAttributesPage.viewAttribute(page, 1);

    const pageTitle = await boAttributesViewPage.getPageTitle(page);
    expect(pageTitle).to.equal(boAttributesViewPage.pageTitle(dataAttributes.size.name));

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Attributes > Add new value\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewAttributeValuePage', baseContext);

    await boAttributesViewPage.goToAddNewValuePage(page);

    const pageTitle = await boAttributesValueCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boAttributesValueCreatePage.createPageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Attributes > Add new attribute\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewAttributePage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );

    await boAttributesPage.goToAddAttributePage(page);

    const pageTitle = await boAttributesCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boAttributesCreatePage.createPageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Features\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToFeaturesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );
    await boAttributesPage.goToFeaturesPage(page);

    const pageTitle = await boFeaturesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boFeaturesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Features > Feature\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToFeaturePage', baseContext);

    await boFeaturesPage.viewFeature(page, 1);

    const pageTitle = await boFeaturesViewPage.getPageTitle(page);
    expect(pageTitle).to.contains(`${dataFeatures.composition.name} • ${global.INSTALL.SHOP_NAME}`);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Features > Add new value\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewFeatureValuePage', baseContext);

    await boFeaturesViewPage.goToAddNewValuePage(page);

    const pageTitle = await boFeaturesValueCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boFeaturesValueCreatePage.createPageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Attributes & Features > Features > Add new feature\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewFeaturePage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );
    await boAttributesPage.goToFeaturesPage(page);

    await boFeaturesPage.goToAddFeaturePage(page);

    const pageTitle = await boFeaturesCreatePage.getPageTitle(page);
    expect(pageTitle).to.eq(boFeaturesCreatePage.createPageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Brands\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToBrandsPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );

    const pageTitle = await boBrandsPage.getPageTitle(page);
    expect(pageTitle).to.contains(boBrandsPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Brands > Brand\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToBrandPage', baseContext);

    await boBrandsPage.viewBrand(page, 1);

    const pageTitle = await viewBrandPage.getPageTitle(page);
    expect(pageTitle).to.contains('Graphic Corner');

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Brands > Address\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToBrandAddressPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToEditBrandAddressPage(page, 1);

    const pageTitle = await addBrandPage.getPageTitle(page);
    expect(pageTitle).to.contains(addBrandPage.pageTitleEdit);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Brands > Add new brand\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewBrandPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToAddNewBrandPage(page);

    const pageTitle = await addBrandPage.getPageTitle(page);
    expect(pageTitle).to.contains(addBrandPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Brands > Add new brand address\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewBrandAddressPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToAddNewBrandAddressPage(page);

    const pageTitle = await addBrandAddressPage.getPageTitle(page);
    expect(pageTitle).to.contains(addBrandAddressPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Suppliers\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToSuppliersPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToSubTabSuppliers(page);

    const pageTitle = await suppliersPage.getPageTitle(page);
    expect(pageTitle).to.contains(suppliersPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Suppliers > View Supplier\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToViewSupplierPage', baseContext);

    await suppliersPage.viewSupplier(page, 1);

    const pageTitle = await viewSupplierPage.getPageTitle(page);
    expect(pageTitle).to.contains(dataSuppliers.accessories.name);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Suppliers > Supplier\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToSupplierPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToSubTabSuppliers(page);
    await suppliersPage.goToEditSupplierPage(page, 1);

    const pageTitle = await boSuppliersCreate.getPageTitle(page);
    expect(pageTitle).to.contains(boSuppliersCreate.pageTitleEdit);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Brands & Suppliers > Suppliers > Add new supplier\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewSupplierPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.brandsAndSuppliersLink,
    );
    await boBrandsPage.goToSubTabSuppliers(page);
    await suppliersPage.goToAddNewSupplierPage(page);

    const pageTitle = await boSuppliersCreate.getPageTitle(page);
    expect(pageTitle).to.contains(boSuppliersCreate.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Files\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToFilesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.filesLink,
    );

    const pageTitle = await boFilesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boFilesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Files > Add new file\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewFilePage', baseContext);

    await boFilesPage.goToAddNewFilePage(page);

    const pageTitle = await addFilePage.getPageTitle(page);
    expect(pageTitle).to.contains(addFilePage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Discounts > Cart Rules\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCartRulesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.discountsLink,
    );

    const pageTitle = await boCartRulesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boCartRulesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Discounts > Cart Rules > Add new cart rule\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewCartRulePage', baseContext);

    await boCartRulesPage.goToAddNewCartRulesPage(page);

    const pageTitle = await boCartRulesCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boCartRulesCreatePage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Discounts > Catalog Price Rules\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCatalogPriceRulesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.discountsLink,
    );
    await boCartRulesPage.goToCatalogPriceRulesTab(page);

    const pageTitle = await boCatalogPriceRulesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boCatalogPriceRulesPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Discounts > Catalog Price Rules > Add new catalog price rule\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewCatalogPriceRulePage', baseContext);

    await boCatalogPriceRulesPage.goToAddNewCatalogPriceRulePage(page);

    const pageTitle = await boCatalogPriceRulesCreatePage.getPageTitle(page);
    expect(pageTitle).to.contains(boCatalogPriceRulesCreatePage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Stock > Stock\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToStockPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.stocksLink,
    );

    const pageTitle = await boStockPage.getPageTitle(page);
    expect(pageTitle).to.contains(boStockPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });

  it('should go to \'Catalog > Stock > Movements\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToMovementsPage', baseContext);

    await boStockPage.goToSubTabMovements(page);

    const pageTitle = await boStockMovementsPage.getPageTitle(page);
    expect(pageTitle).to.contains(boStockMovementsPage.pageTitle);

    const jsErrors = utilsPlaywright.getJsErrors();
    expect(jsErrors.length).to.equals(0);
  });
});
