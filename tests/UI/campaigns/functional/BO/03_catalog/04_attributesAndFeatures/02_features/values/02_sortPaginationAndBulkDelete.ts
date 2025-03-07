import testContext from '@utils/testContext';
import {expect} from 'chai';

import {
  boAttributesPage,
  boDashboardPage,
  boFeaturesPage,
  boFeaturesValueCreatePage,
  boFeaturesViewPage,
  boLoginPage,
  type BrowserContext,
  dataFeatures,
  FakerFeatureValue,
  type Page,
  utilsCore,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_catalog_attributesAndFeatures_features_values_sortPaginationAndBulkDelete';

/*
Go to Attributes & Features page
Go to Features tab
View the feature 'Composition'
Create 15 new values
Pagination next and previous
Sort features table by ID and Name
Delete the created value by bulk actions
 */
describe('BO - Catalog - Catalog > Attributes & Features : Sort, pagination and delete by bulk actions '
  + 'feature values', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfValues: number = 0;

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

  it('should go to \'Catalog > Attributes & Features\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAttributesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.attributesAndFeaturesLink,
    );
    await boAttributesPage.closeSfToolBar(page);

    const pageTitle = await boAttributesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boAttributesPage.pageTitle);
  });

  it('should go to Features page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToFeaturesPage', baseContext);

    await boAttributesPage.goToFeaturesPage(page);

    const pageTitle = await boFeaturesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boFeaturesPage.pageTitle);
  });

  it('should filter list of features by name \'Composition\'', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'filterToBulkDeleteAttributes', baseContext);

    await boFeaturesPage.filterTable(page, 'name', dataFeatures.composition.name);

    const textColumn = await boFeaturesPage.getTextColumn(page, 1, 'name', 'id_feature');
    expect(textColumn).to.contains('Composition');
  });

  it('should view feature \'Composition\'', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'viewFeatureComposition1', baseContext);

    await boFeaturesPage.viewFeature(page, 1);

    const pageTitle = await boFeaturesViewPage.getPageTitle(page);
    expect(pageTitle).to.contains(`${dataFeatures.composition.name} • ${global.INSTALL.SHOP_NAME}`);

    numberOfValues = await boFeaturesViewPage.resetAndGetNumberOfLines(page);
    expect(numberOfValues).to.be.above(0);
  });

  // 1 : Create 15 new values
  const creationTests: number[] = new Array(15).fill(0, 0, 15);
  describe('Create 15 new values in BO', async () => {
    it('should go to add new value page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToAddNewValuePage', baseContext);

      await boFeaturesViewPage.goToAddNewValuePage(page);

      const pageTitle = await boFeaturesValueCreatePage.getPageTitle(page);
      expect(pageTitle).to.contains(boFeaturesValueCreatePage.createPageTitle);
    });

    creationTests.forEach((test: number, index: number) => {
      const createFeatureValueData: FakerFeatureValue = new FakerFeatureValue({
        featureName: 'Composition',
        value: `todelete${index}`,
      });
      it(`should create value n°${index + 1}`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createNewValue${index}`, baseContext);

        if (index === 14) {
          const textResult = await boFeaturesValueCreatePage.addEditValue(page, createFeatureValueData, false);
          expect(textResult).to.contains(boFeaturesViewPage.successfulCreationMessage);
        } else {
          await boFeaturesValueCreatePage.addEditValue(page, createFeatureValueData, true);
        }
      });
    });

    it('should view feature \'Composition\' and check number of values after creation', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'viewFeatureComposition2', baseContext);

      const pageTitle = await boFeaturesViewPage.getPageTitle(page);
      expect(pageTitle).to.contains(`${dataFeatures.composition.name} • ${global.INSTALL.SHOP_NAME}`);

      const numberOfValuesAfterCreation = await boFeaturesViewPage.resetAndGetNumberOfLines(page);
      expect(numberOfValuesAfterCreation).to.equal(numberOfValues + 15);
    });
  });

  // 2 : Pagination
  describe('Pagination next and previous', async () => {
    it('should change the items number to 20 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemsNumberTo20', baseContext);

      const paginationNumber = await boFeaturesViewPage.selectPaginationLimit(page, 20);
      expect(paginationNumber).to.equal(1);
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNext', baseContext);

      const paginationNumber = await boFeaturesViewPage.paginationNext(page);
      expect(paginationNumber).to.equal(2);
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnPrevious', baseContext);

      const paginationNumber = await boFeaturesViewPage.paginationPrevious(page);
      expect(paginationNumber).to.equal(1);
    });

    it('should change the items number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemsNumberTo50', baseContext);

      const paginationNumber = await boFeaturesViewPage.selectPaginationLimit(page, 50);
      expect(paginationNumber).to.equal(1);
    });
  });

  // 3 : Sort values
  describe('Sort values table', async () => {
    const sortTests = [
      {
        args: {
          testIdentifier: 'sortByIdDesc', sortBy: 'id_feature_value', sortDirection: 'desc', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByNameAsc', sortBy: 'value', sortDirection: 'asc',
        },
      },
      {
        args: {
          testIdentifier: 'sortByNameDesc', sortBy: 'value', sortDirection: 'desc',
        },
      },
      {
        args: {
          testIdentifier: 'sortByIdAsc', sortBy: 'id_feature_value', sortDirection: 'asc', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByPositionAsc', sortBy: 'position', sortDirection: 'asc', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByPositionDesc', sortBy: 'position', sortDirection: 'desc', isFloat: true,
        },
      },
    ];

    sortTests.forEach((test) => {
      it(`should sort by '${test.args.sortBy}' '${test.args.sortDirection}' and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        const nonSortedTable = await boFeaturesViewPage.getAllRowsColumnContent(page, test.args.sortBy);

        await boFeaturesViewPage.sortTable(page, test.args.sortBy, test.args.sortDirection);

        const sortedTable = await boFeaturesViewPage.getAllRowsColumnContent(page, test.args.sortBy);

        if (test.args.isFloat) {
          const nonSortedTableFloat: number[] = nonSortedTable.map((text: string): number => parseFloat(text));
          const sortedTableFloat: number[] = sortedTable.map((text: string): number => parseFloat(text));

          const expectedResult: number[] = await utilsCore.sortArrayNumber(nonSortedTableFloat);

          if (test.args.sortDirection === 'asc') {
            expect(sortedTableFloat).to.deep.equal(expectedResult);
          } else {
            expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
          }
        } else {
          const expectedResult: string[] = await utilsCore.sortArray(nonSortedTable);

          if (test.args.sortDirection === 'asc') {
            expect(sortedTable).to.deep.equal(expectedResult);
          } else {
            expect(sortedTable).to.deep.equal(expectedResult.reverse());
          }
        }
      });
    });
  });

  // 4 : Delete created values by bulk actions
  describe('Bulk delete values', async () => {
    it('should filter by value name \'toDelete\'', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToBulkDelete', baseContext);

      await boFeaturesViewPage.filterTable(page, 'value', 'toDelete');

      const numberOfValuesAfterFilter = await boFeaturesViewPage.getNumberOfElementInGrid(page);
      expect(numberOfValuesAfterFilter).to.be.equal(15);
    });

    it('should delete values with Bulk Actions and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'bulkDeleteFeatures', baseContext);

      const deleteTextResult = await boFeaturesViewPage.bulkDeleteValues(page);
      expect(deleteTextResult).to.be.contains(boFeaturesViewPage.successfulMultiDeleteMessage);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilter', baseContext);

      const numberOfValuesAfterReset = await boFeaturesViewPage.resetAndGetNumberOfLines(page);
      expect(numberOfValuesAfterReset).to.equal(numberOfValues);
    });
  });
});
