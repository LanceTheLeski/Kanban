using Kanban.Contracts.Request.Patch;
using Kanban.API.Models;
using Microsoft.AspNetCore.JsonPatch;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface IColumnRepository
{
    public Task<Collection<Column>> GetAllColumnsForBoard (Guid boardID);

    public Task<Column?> GetColumnAsync (Guid columnID, Guid boardID);

    public Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression);

    public ColumnPatchRequest ApplyJsonPatchDocumentToColumn (JsonPatchDocument<ColumnPatchRequest> columnPatchRequest, Column columnToUpdate);

    public Collection<Column> ApplyAllOtherColumnOrdersAsync (Collection<Column> columnCollection, int oldColumnOrder, int newColumnOrder);

    public Task UpdateColumnBatchAndTheirBoardCardsAsync (Collection<Column> columnCollection);

    public Task UpdateColumnToDeleteBordCardBatchAsync (Column columnToDelete, Column columnForTransfer);

    public (int oldOrder, int newOrder) GetColumnOrderChange (Column columnBeforeUpdate, ColumnPatchRequest columnAfterUpdate);
}