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

declare(strict_types=1);

namespace Tests\Unit\Core\Grid\Data\Factory;

use Doctrine\DBAL\Query\QueryBuilder;
use Doctrine\DBAL\Result;
use PHPUnit\Framework\TestCase;
use PrestaShop\PrestaShop\Core\Grid\Data\Factory\DoctrineGridDataFactory;
use PrestaShop\PrestaShop\Core\Grid\Data\GridDataInterface;
use PrestaShop\PrestaShop\Core\Grid\Query\DoctrineQueryBuilderInterface;
use PrestaShop\PrestaShop\Core\Grid\Query\QueryParserInterface;
use PrestaShop\PrestaShop\Core\Grid\Record\RecordCollectionInterface;
use PrestaShop\PrestaShop\Core\Grid\Search\SearchCriteriaInterface;
use PrestaShop\PrestaShop\Core\Hook\HookDispatcherInterface;

class DoctrineGridDataFactoryTest extends TestCase
{
    public function testItProvidesGridData()
    {
        $hookDispatcher = $this->createHookDispatcherMock();

        $queryParser = $this->createQueryParserMock();

        $doctrineGridDataFactory = new DoctrineGridDataFactory(
            $this->createDoctrineQueryBuilderMock(),
            $hookDispatcher,
            $queryParser,
            'test_grid_id'
        );

        $criteria = $this->createMock(SearchCriteriaInterface::class);

        $data = $doctrineGridDataFactory->getData($criteria);

        $this->assertInstanceOf(GridDataInterface::class, $data);
        $this->assertInstanceOf(RecordCollectionInterface::class, $data->getRecords());

        $this->assertEquals(4, $data->getRecordsTotal());
        $this->assertCount(2, $data->getRecords());
        $this->assertEquals('SELECT * FROM ps_test WHERE id = 1', $data->getQuery());
    }

    /**
     * @return DoctrineQueryBuilderInterface
     */
    private function createDoctrineQueryBuilderMock(): DoctrineQueryBuilderInterface
    {
        $result = $this->createMock(Result::class);
        $result->method('fetchAllAssociative')
            ->willReturn([
                [
                    'id' => 1,
                    'name' => 'Test name 1',
                ],
                [
                    'id' => 2,
                    'name' => 'Test name 2',
                ],
            ]);
        $result->method('fetchOne')
            ->willReturn(4);

        $qb = $this->createMock(QueryBuilder::class);
        $qb->method('executeQuery')
            ->willReturn($result);
        $qb->method('getSQL')
            ->willReturn('SELECT * FROM ps_test WHERE id = :id');
        $qb->method('getParameters')
            ->willReturn([
                'id' => 1,
            ]);

        $doctrineQueryBuilder = $this->createMock(DoctrineQueryBuilderInterface::class);
        $doctrineQueryBuilder->method('getSearchQueryBuilder')
            ->willReturn($qb);
        $doctrineQueryBuilder->method('getCountQueryBuilder')
            ->willReturn($qb);

        return $doctrineQueryBuilder;
    }

    /**
     * @return HookDispatcherInterface
     */
    private function createHookDispatcherMock(): HookDispatcherInterface
    {
        $hookDispatcher = $this->createMock(HookDispatcherInterface::class);
        $hookDispatcher->method('dispatchWithParameters')
            ->willReturn(null);
        $hookDispatcher->expects($this->once())
            ->method('dispatchWithParameters');

        return $hookDispatcher;
    }

    /**
     * @return QueryParserInterface
     */
    private function createQueryParserMock(): QueryParserInterface
    {
        $queryParser = $this->getMockBuilder(QueryParserInterface::class)
            ->onlyMethods(['parse'])
            ->getMockForAbstractClass();

        $queryParser->method('parse')->willReturn('SELECT * FROM ps_test WHERE id = 1');

        return $queryParser;
    }
}
