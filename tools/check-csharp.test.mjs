/**
 * check-csharp.test.mjs
 *
 * check-csharp.mjs on a few lines that are in the house style and a few that
 * are not — above all the ones a pattern could get wrong: strings, comments,
 * interpolation holes, the null-forgiving "!", and the new() constraint.
 *
 *   node tools/check-csharp.test.mjs
 */

import { check, checkFile, fix } from './check-csharp.mjs'

// [what, code, the rules it should break, and the file it is in when that matters]
const cases = [
    ['a call in the house style', 'var value = Guid.Parse (text);', []],
    ['a call without its space', 'var value = Guid.Parse(text);', ['space-before-paren']],
    ['an empty call without its space', 'var count = items.Count();', ['space-before-paren']],
    ['a generic call', 'var types = await Query<TaskType> ();', []],
    ['a generic call without its space', 'var types = await Query<TaskType>();', ['space-before-paren']],
    ['a keyword without its space', 'if(value is null) return;', ['space-before-paren']],
    ['an attribute', '[Route ("arcstrides/boards")]', []],
    ['an attribute without its space', '[ArcTableName("Cards")]', ['space-before-paren']],
    ['a cast', 'var day = (int) date.DayOfWeek;', []],
    ['a call inside a string', 'var text = "Parse(value) and !done == null";', []],
    ['a call inside a comment', 'var value = 1; // Parse(value), !done, boardId', []],
    ['a call inside an interpolation hole, in a string', 'var text = $"{Format ("a(b)")} and {count}";', []],
    ['a verbatim string with a doubled quote', 'var text = @"say ""Parse(x)"" twice";', []],
    ['the new() constraint', 'public class Store<T> where T : class, ITableEntity, new()', []],
    ['a null check by pattern', 'if (card is not null) return;', []],
    ['a null check by operator', 'if (card != null) return;', ['null-check']],
    ['a negation by pattern', 'if (result.IsValid is false) return;', []],
    ['a negation by "!"', 'if (!result.IsValid) return;', ['negation']],
    ['the null-forgiving "!"', 'var key = Guid.Parse (entity.RowKey!);', []],
    ['not-equals', 'if (count != 2) return;', []],
    ['ID in capitals', 'public Guid BoardID { get; set; }', []],
    ['Id in a name', 'public Guid boardId { get; set; }', ['id-casing']],
    ['Id on its own', 'public int Id { get; set; }', ['id-casing']],
    ['IDs in capitals', 'public string? TaskTypeIDs { get; set; }', []],
    ['Ids in a name', 'public IEnumerable<Guid> ActionLocationIds { get; set; }', ['id-casing']],
    ['a word that only starts like Id', 'var identity = Identity.Create ();', []],
    ['a file-scoped namespace', 'namespace ArcStrides.API.Controllers;', []],
    ['a braced namespace', 'namespace ArcStrides.API.Controllers', ['namespace']],
    ['a private field', 'private readonly ICardRepository _cardRepository;', []],
    ['a private field without its underscore', 'private readonly ICardRepository cardRepository;', ['private-field']],
    ['a private constant', 'private const int maxLength = 5;', []],
    ['a tab indent', '\tvar value = 1;', ['tabs']],
    ['an allowed exception', 'var value = Parse(text); // house-style: allow — the library\'s own sample', []],
    ['a repository method', 'Task<Card?> GetCardAsync (Guid boardID, Guid cardID);', [], 'API/Repositories/ICardRepository.cs'],
    ['a repository method without Async', 'public async Task<Collection<Column>> GetAllBoardColumns (Guid boardID)', ['async-suffix'], 'API/Repositories/ColumnRepository.cs'],
    ['a service method returning a bare Task', 'public async Task AddEntity (T entity)', ['async-suffix'], 'API/Services/AzureTableService.cs'],
    ['a call to Task.WhenAll in a repository', 'await Task.WhenAll (tasks);', [], 'API/Repositories/CardRepository.cs'],
    ['the same method outside a repository', 'public async Task<Collection<Column>> GetAllBoardColumns (Guid boardID)', [], 'API/Controllers/ColumnController.cs'],
    ['a controller action', '    public async Task<ActionResult> FetchBoard ([FromRoute] Guid ID)', [], 'API/Controllers/BoardController.cs'],
    ['a controller action with Async', '    public async Task<ActionResult> FetchTagTypeAsync (Guid ID)', ['action-name'], 'API/Controllers/TagController.cs'],
    ['a typed controller action with Async', '    public async Task<ActionResult<BoardResponse>> FetchBoardAsync (Guid ID)', ['action-name'], 'API/Controllers/BoardController.cs'],
    ['a private controller helper with Async', '    private async Task<IReadOnlyList<Date>> QueryMonthAsync (int year, int month)', [], 'API/Controllers/CalendarController.cs'],
]

let failed = 0
for (const [what, code, expected, file] of cases) {
    const got = check(code, file).map(finding => finding.rule)
    const ok = JSON.stringify(got.sort()) === JSON.stringify([...expected].sort())
    if (!ok) failed += 1
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` — got ${JSON.stringify(got)}`}`)
}

// And the file as a whole: it starts with a byte order mark.
const files = [
    ['a file with its byte order mark', '\uFEFFnamespace ArcStrides.API;', []],
    ['a file without one', 'namespace ArcStrides.API;', ['encoding']],
]
for (const [what, text, expected] of files) {
    const got = checkFile(text, 'API/Models/Card.cs').map(finding => finding.rule)
    const ok = JSON.stringify(got) === JSON.stringify(expected)
    if (!ok) failed += 1
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${ok ? '' : ` — got ${JSON.stringify(got)}`}`)
}

// And --fix: the spaces and the indent, and nothing else.
const fixes = [
    ['Guid.Parse(text).ToString()', 'Guid.Parse (text).ToString ()'],
    ['\tapp.UseHsts();', '    app.UseHsts ();'],
    ['var text = "Parse(x)"; // Parse(y)', 'var text = "Parse(x)"; // Parse(y)'],
    ['public class Store<T> where T : new()', 'public class Store<T> where T : new()'],
    ['if (!done) return;', 'if (!done) return;'],
]
for (const [before, after] of fixes) {
    const got = fix(before)
    const ok = got === after
    if (!ok) failed += 1
    console.log(`${ok ? 'ok  ' : 'FAIL'} fix ${JSON.stringify(before)}${ok ? '' : ` — got ${JSON.stringify(got)}`}`)
}

console.log(failed ? `\n${failed} failed` : `\nall ${cases.length + files.length + fixes.length} passed`)
process.exit(failed ? 1 : 0)
