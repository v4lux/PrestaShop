import testContext from '@utils/testContext';
import {expect} from 'chai';

import {
  boDashboardPage,
  boLoginPage,
  boProductsPage,
  boProductsCreatePage,
  boProductsCreateTabDescriptionPage,
  type BrowserContext,
  dataCategories,
  type Page,
  type ProductFilterMinMax,
  utilsCore,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_catalog_products_filterSortPagination';

describe('BO - Catalog - Products list : Filter & Sort, Pagination, Filter by category, Position', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfProducts: number = 0;
  let numberOfProductsAfterFilter: number = 0;

  // before and after functions
  before(async function () {
    browserContext = await utilsPlaywright.createBrowserContext(this.browser);
    page = await utilsPlaywright.newTab(browserContext);
  });

  after(async () => {
    await utilsPlaywright.closeBrowserContext(browserContext);
  });

  describe('Filter products table by : ID, Name, Reference, Category, Price, Quantity and Status', async () => {
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

      const pageTitle = await boProductsPage.getPageTitle(page);
      expect(pageTitle).to.contains(boProductsPage.pageTitle);
    });

    it('should reset filter', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilter', baseContext);

      numberOfProducts = await boProductsPage.resetAndGetNumberOfLines(page);
      expect(numberOfProducts).to.be.gt(0);
    });

    [
      {
        args: {
          identifier: 'filterIDMinMax',
          filterBy: 'id_product',
          filterValue: {min: 2, max: 5} as ProductFilterMinMax,
          filterType: 'input',
          comparisonType: 'toWithinMinMax',
        },
      },
      {
        args: {
          identifier: 'filterName',
          filterBy: 'product_name',
          filterValue: 'mug',
          filterType: 'input',
        },
      },
      {
        args: {
          identifier: 'filterReference',
          filterBy: 'reference',
          filterValue: '2',
          filterType: 'input',
        },
      },
      {
        args: {
          identifier: 'filterCategory',
          filterBy: 'category',
          filterValue: dataCategories.art.name.toLowerCase(),
          filterType: 'input',
        },
      },
      {
        args: {
          identifier: 'filterPriceMinMax',
          filterBy: 'price',
          filterValue: {min: 15, max: 25} as ProductFilterMinMax,
          filterType: 'input',
          comparisonType: 'toWithinMinMax',
        },
      },
      {
        args: {
          identifier: 'filterQuantityMinMax',
          filterBy: 'quantity',
          filterValue: {min: 1000, max: 1200} as ProductFilterMinMax,
          filterType: 'input',
          comparisonType: 'toWithinMinMax',
        },
      },
    ].forEach((test) => {
      it(`should filter list by '${test.args.filterBy}' and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.identifier}`, baseContext);

        await boProductsPage.filterProducts(page, test.args.filterBy, test.args.filterValue, test.args.filterType);

        const numberOfProductsAfterFilter = await boProductsPage.getNumberOfProductsFromList(page);
        expect(numberOfProductsAfterFilter).to.be.below(numberOfProducts);

        for (let i = 1; i <= numberOfProductsAfterFilter; i++) {
          const textColumn = await boProductsPage.getTextColumn(page, test.args.filterBy, i);

          switch (test.args.comparisonType) {
            case 'toWithinMinMax':
              expect(typeof test.args.filterValue).to.be.eq('object');
              if (typeof test.args.filterValue !== 'string') {
                expect(textColumn).to.within(test.args.filterValue.min, test.args.filterValue.max);
              }
              break;

            default:
              expect(textColumn.toString().toLowerCase()).to.contains(test.args.filterValue);
          }
        }
      });

      it('should reset filter', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `resetAfter${test.args.identifier}`, baseContext);

        const numberOfProductsAfterReset = await boProductsPage.resetAndGetNumberOfLines(page);
        expect(numberOfProductsAfterReset).to.equal(numberOfProducts);
      });
    });

    it('should filter list by \'active\' No and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterByStatusNo', baseContext);

      await boProductsPage.filterProducts(page, 'active', 'No', 'select');

      const textColumn = await boProductsPage.getTextForEmptyTable(page);
      expect(textColumn).to.equal('warning No records found');
    });

    it('should reset filter', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterByStatus', baseContext);

      const numberOfProductsAfterReset = await boProductsPage.resetAndGetNumberOfLines(page);
      expect(numberOfProductsAfterReset).to.equal(numberOfProducts);
    });
  });

  describe('Filter products table by : Category', async () => {
    [
      {
        categoryName: dataCategories.clothes.name,
        numProducts: 2,
      },
      {
        categoryName: dataCategories.art.name,
        numProducts: 7,
      },
    ].forEach((arg:{categoryName: string, numProducts: number}) => {
      describe('Filter by Category', () => {
        it(`should filter by category '${arg.categoryName}'`, async function () {
          await testContext.addContextItem(this, 'testIdentifier', `filterByCategories${arg.categoryName}`, baseContext);

          await boProductsPage.filterProductsByCategory(page, arg.categoryName);

          const numberOfProductsAfterFilter = await boProductsPage.getNumberOfProductsFromList(page);
          expect(numberOfProductsAfterFilter).to.be.below(numberOfProducts);
        });

        it('should check result', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `checkResults${arg.categoryName}`, baseContext);

          const filterButtonName = await boProductsPage.getFilterByCategoryButtonName(page);
          expect(filterButtonName).to.equal(`Filter by categories (${arg.categoryName})`);

          numberOfProductsAfterFilter = await boProductsPage.getNumberOfProductsFromList(page);
          expect(numberOfProductsAfterFilter).to.be.equals(arg.numProducts);

          const isVisible = await boProductsPage.isClearFilterLinkVisible(page);
          expect(isVisible).to.eq(true);
        });
      });

      for (let idxProduct = 1; idxProduct <= arg.numProducts; idxProduct++) {
        // eslint-disable-next-line no-loop-func
        describe(`Check the category for the product #${idxProduct}`, () => {
          it('should go to the Product Page', async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `goToRow${idxProduct}Category${arg.categoryName}`,
              baseContext,
            );

            await boProductsPage.goToProductPage(page, idxProduct);

            const pageTitle: string = await boProductsCreatePage.getPageTitle(page);
            expect(pageTitle).to.contains(boProductsCreatePage.pageTitle);
          });

          it('should check the category in categories of the product', async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `checkCategories${idxProduct}Category${arg.categoryName}`,
              baseContext,
            );

            const selectedCategories: string = await boProductsCreateTabDescriptionPage.getSelectedCategories(page);
            expect(selectedCategories).to.contains(arg.categoryName);
          });

          it('should return to the list', async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `returnToList${idxProduct}Category${arg.categoryName}`,
              baseContext,
            );

            await boProductsCreatePage.goToCatalogPage(page);

            const pageTitle = await boProductsPage.getPageTitle(page);
            expect(pageTitle).to.contains(boProductsPage.pageTitle);
          });
        });
      }

      describe('Reset the filter', () => {
        it('should click on \'Clear filter\' button', async function () {
          await testContext.addContextItem(this, 'testIdentifier', `clickOnClearFilterButton${arg.categoryName}`, baseContext);

          await boProductsPage.clickOnClearFilterLink(page);

          const numberOfProductsAfterReset = await boProductsPage.resetAndGetNumberOfLines(page);
          expect(numberOfProductsAfterReset).to.equal(numberOfProducts);
        });
      });
    });
  });

  describe('Filter products table by : Pagination', async () => {
    it('should change display items to 10', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeDisplayItemsTo10', baseContext);

      const paginationNumber = await boProductsPage.selectPaginationLimit(page, 10);
      expect(paginationNumber).to.contains('page 1');
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNext', baseContext);

      const paginationNumber = await boProductsPage.paginationNext(page);
      expect(paginationNumber).to.contains('page 2');
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnPrevious', baseContext);

      const paginationNumber = await boProductsPage.paginationPrevious(page);
      expect(paginationNumber).to.contains('page 1');
    });

    it('should set the pagination page to 2', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'setPaginationPage', baseContext);

      const paginationNumber = await boProductsPage.setPaginationPage(page, 2);
      expect(paginationNumber).to.contains('page 2');
    });

    it('should change the items number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemsNumberTo50', baseContext);

      const paginationNumber = await boProductsPage.selectPaginationLimit(page, 50);
      expect(paginationNumber).to.contains('page 1');
    });
  });

  describe('Sort products table', async () => {
    const tests = [
      {
        identifier: 'sortByIdDesc',
        sortBy: 'id_product',
        column: 2,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByNameAsc',
        sortBy: 'name',
        column: 4,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByNameDesc',
        sortBy: 'name',
        column: 4,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByReferenceAsc',
        sortBy: 'reference',
        column: 5,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByReferenceDesc',
        sortBy: 'reference',
        column: 5,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByCategoryAsc',
        sortBy: 'category',
        column: 6,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByCategoryDesc',
        sortBy: 'category',
        column: 6,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByPriceTaxExcludedAsc',
        sortBy: 'final_price_tax_excluded',
        column: 7,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByPriceTaxExcludedDesc',
        sortBy: 'final_price_tax_excluded',
        column: 7,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByQuantityAsc',
        sortBy: 'quantity',
        column: 9,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByQuantityDesc',
        sortBy: 'quantity',
        column: 9,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByStatusAsc',
        sortBy: 'active',
        column: 10,
        sortDirection: 'asc',
      },
      {
        identifier: 'sortByStatusDesc',
        sortBy: 'active',
        column: 10,
        sortDirection: 'desc',
      },
      {
        identifier: 'sortByIdAsc',
        sortBy: 'id_product',
        column: 2,
        sortDirection: 'asc',
      },
    ];

    tests.forEach((test) => {
      it(`should sort by '${test.sortBy}' '${test.sortDirection}' and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.identifier, baseContext);

        const nonSortedTable = await boProductsPage.getAllRowsColumnContent(page, test.column);

        await boProductsPage.sortTable(page, test.sortBy, test.sortDirection);

        const sortedTable = await boProductsPage.getAllRowsColumnContent(page, test.column);

        const nonSortedTableFloat: number[] = nonSortedTable.map((text: string): number => parseFloat(text));
        const sortedTableFloat: number[] = sortedTable.map((text: string): number => parseFloat(text));

        const expectedResult = await utilsCore.sortArrayNumber(nonSortedTableFloat);

        if (test.sortDirection === 'asc') {
          expect(sortedTableFloat).to.deep.equal(expectedResult);
        } else {
          expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
        }
      });
    });
  });
});
