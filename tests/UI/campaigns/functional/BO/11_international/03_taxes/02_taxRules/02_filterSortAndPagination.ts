import testContext from '@utils/testContext';
import {expect} from 'chai';

import {
  boDashboardPage,
  boLoginPage,
  boTaxesPage,
  boTaxRulesPage,
  boTaxRulesCreatePage,
  dataTaxRules,
  type BrowserContext,
  FakerTaxRulesGroup,
  type Page,
  utilsCore,
  utilsPlaywright,
} from '@prestashop-core/ui-testing';

const baseContext: string = 'functional_BO_international_taxes_taxRules_filterSortAndPagination';

/*
Filter tax rules table by id, name and enabled
Sort table by id and name
Create 16 new tax rules
Test pagination next and previous
Delete the created tax rules by bulk actions
 */
describe('BO - International - Tax rules : Filter, sort and pagination', async () => {
  let browserContext: BrowserContext;
  let page: Page;
  let numberOfTaxRules: number = 0;

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

  it('should go to \'International > Taxes\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToTaxesPage', baseContext);

    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.internationalParentLink,
      boDashboardPage.taxesLink,
    );

    const pageTitle = await boTaxesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boTaxesPage.pageTitle);
  });

  it('should go to \'Tax Rules\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToTaxRulesPage', baseContext);

    await boTaxesPage.goToTaxRulesPage(page);

    const pageTitle = await boTaxRulesPage.getPageTitle(page);
    expect(pageTitle).to.contains(boTaxRulesPage.pageTitle);
  });

  it('should reset all filters and get number of Tax rules in BO', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);

    numberOfTaxRules = await boTaxRulesPage.resetAndGetNumberOfLines(page);
    expect(numberOfTaxRules).to.be.above(0);
  });

  // 1 - Filter tax rules
  describe('Filter tax rules table', async () => {
    const tests = [
      {
        args:
          {
            testIdentifier: 'filterById',
            filterType: 'input',
            filterBy: 'id_tax_rules_group',
            filterValue: dataTaxRules[3].id.toString(),
          },
      },
      {
        args:
          {
            testIdentifier: 'filterByName',
            filterType: 'input',
            filterBy: 'name',
            filterValue: dataTaxRules[1].name,
          },
      },
      {
        args:
          {
            testIdentifier: 'filterByStatus',
            filterType: 'select',
            filterBy: 'active',
            filterValue: '1',
          },
        expected: 'Enabled',
      },
    ];

    tests.forEach((test) => {
      it(`should filter by ${test.args.filterBy} '${test.args.filterValue}'`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        await boTaxRulesPage.filterTable(
          page,
          test.args.filterType,
          test.args.filterBy,
          test.args.filterValue,
        );

        const numberOfLinesAfterFilter = await boTaxRulesPage.getNumberOfElementInGrid(page);
        expect(numberOfLinesAfterFilter).to.be.at.most(numberOfTaxRules);

        for (let row = 1; row <= numberOfLinesAfterFilter; row++) {
          const textColumn = await boTaxRulesPage.getTextColumnFromTable(page, row, test.args.filterBy);

          if (test.expected !== undefined) {
            expect(textColumn).to.contains(test.expected);
          } else {
            expect(textColumn).to.contains(test.args.filterValue);
          }
        }
      });

      it('should reset all filters', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `${test.args.testIdentifier}Reset`, baseContext);

        const numberOfLinesAfterReset = await boTaxRulesPage.resetAndGetNumberOfLines(page);
        expect(numberOfLinesAfterReset).to.equal(numberOfTaxRules);
      });
    });
  });

  // 2 - Sort tax rules table
  describe('Sort tax rules table', async () => {
    const sortTests = [
      {
        args: {
          testIdentifier: 'sortByIdDesc', sortBy: 'id_tax_rules_group', sortDirection: 'down', isFloat: true,
        },
      },
      {
        args: {
          testIdentifier: 'sortByNameAsc', sortBy: 'name', sortDirection: 'up',
        },
      },
      {
        args: {
          testIdentifier: 'sortByNameDesc', sortBy: 'name', sortDirection: 'down',
        },
      },
      {
        args: {
          testIdentifier: 'sortByIdAsc', sortBy: 'id_tax_rules_group', sortDirection: 'up', isFloat: true,
        },
      },
    ];

    sortTests.forEach((test) => {
      it(`should sort by '${test.args.sortBy}' '${test.args.sortDirection}' and check result`, async function () {
        await testContext.addContextItem(this, 'testIdentifier', test.args.testIdentifier, baseContext);

        const nonSortedTable = await boTaxRulesPage.getAllRowsColumnContent(page, test.args.sortBy);

        await boTaxRulesPage.sortTable(page, test.args.sortBy, test.args.sortDirection);

        const sortedTable = await boTaxRulesPage.getAllRowsColumnContent(page, test.args.sortBy);

        if (test.args.isFloat) {
          const nonSortedTableFloat: number[] = nonSortedTable.map((text: string): number => parseFloat(text));
          const sortedTableFloat: number[] = sortedTable.map((text: string): number => parseFloat(text));

          const expectedResult = await utilsCore.sortArrayNumber(nonSortedTableFloat);

          if (test.args.sortDirection === 'up') {
            expect(sortedTableFloat).to.deep.equal(expectedResult);
          } else {
            expect(sortedTableFloat).to.deep.equal(expectedResult.reverse());
          }
        } else {
          const expectedResult = await utilsCore.sortArray(nonSortedTable);

          if (test.args.sortDirection === 'up') {
            expect(sortedTable).to.deep.equal(expectedResult);
          } else {
            expect(sortedTable).to.deep.equal(expectedResult.reverse());
          }
        }
      });
    });
  });

  // 3 - Create 16 tax rules
  const creationTests: number[] = new Array(16).fill(0, 0, 16);

  creationTests.forEach((test: number, index: number) => {
    describe(`Create tax rule n°${index + 1} in BO`, async () => {
      const taxRuleData: FakerTaxRulesGroup = new FakerTaxRulesGroup({name: `todelete${index}`});

      it('should go to add new tax rule group page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToAddTaxRuleGroupPage${index}`, baseContext);

        await boTaxRulesPage.goToAddNewTaxRulesGroupPage(page);

        const pageTitle = await boTaxRulesCreatePage.getPageTitle(page);
        expect(pageTitle).to.contains(boTaxRulesCreatePage.pageTitleCreate);
      });

      it('should create tax rule group and check result', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createTaxRule${index}`, baseContext);

        const textResult = await boTaxRulesCreatePage.createEditTaxRulesGroup(page, taxRuleData);
        expect(textResult).to.contains(boTaxRulesCreatePage.successfulCreationMessage);

        await boTaxesPage.goToTaxRulesPage(page);

        const numberOfLinesAfterCreation = await boTaxRulesPage.getNumberOfElementInGrid(page);
        expect(numberOfLinesAfterCreation).to.be.equal(numberOfTaxRules + 1 + index);
      });
    });
  });

  // 4 - Pagination
  describe('Pagination next and previous', async () => {
    it('should change the item number to 20 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemNumberTo20', baseContext);

      const paginationNumber = await boTaxRulesPage.selectPaginationLimit(page, 20);
      expect(paginationNumber).to.equal('1');
    });

    it('should click on next', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnNext', baseContext);

      const paginationNumber = await boTaxRulesPage.paginationNext(page);
      expect(paginationNumber).to.equal('2');
    });

    it('should click on previous', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'clickOnPrevious', baseContext);

      const paginationNumber = await boTaxRulesPage.paginationPrevious(page);
      expect(paginationNumber).to.equal('1');
    });

    it('should change the item number to 50 per page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'changeItemNumberTo50', baseContext);

      const paginationNumber = await boTaxRulesPage.selectPaginationLimit(page, 50);
      expect(paginationNumber).to.equal('1');
    });
  });

  // 5 : Delete tax rules created with bulk actions
  describe('Delete tax rules with Bulk Actions', async () => {
    it('should filter list by name', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterForBulkDelete', baseContext);

      await boTaxRulesPage.filterTable(
        page,
        'input',
        'name',
        'todelete',
      );

      const numberOfLinesAfterFilter = await boTaxRulesPage.getNumberOfElementInGrid(page);

      for (let i = 1; i <= numberOfLinesAfterFilter; i++) {
        const textColumn = await boTaxRulesPage.getTextColumnFromTable(
          page,
          i,
          'name',
        );
        expect(textColumn).to.contains('todelete');
      }
    });

    it('should delete tax rules with Bulk Actions and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'bulkDeleteCarriers', baseContext);

      const deleteTextResult = await boTaxRulesPage.bulkDeleteTaxRules(page);
      expect(deleteTextResult).to.be.contains(boTaxRulesPage.successfulMultiDeleteMessage);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFilterAfterDelete', baseContext);

      const numberOfLinesAfterReset = await boTaxRulesPage.resetAndGetNumberOfLines(page);
      expect(numberOfLinesAfterReset).to.be.equal(numberOfTaxRules);
    });
  });
});
