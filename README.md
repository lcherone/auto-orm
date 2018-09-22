[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard) [![NPM](https://nodei.co/npm/lxc-query.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/lxc-query/)

[![Build Status](https://travis-ci.org/lcherone/lxc-query.svg?branch=master)](https://travis-ci.org/lcherone/lxc-query)

A lightweight easy to use Zero Config MySQL ORM for nodejs that 'automagically' builds your database schema.

## Install

Install the package with npm:

``` bash
$ npm i autorm
```

## Usage

### Connection Options

Creating a database instance is very similar to the [mysql](https://www.npmjs.com/package/mysql) module:

``` javascript
const Database = new(require('...'))({
    host: '127.0.0.1',
    user: '...',
    password: '...',
    database: '...',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    freeze: false,
    underscore: true
});
```

Internally we use the connection pool method, so the connection object accepts any mysql [pool options](https://github.com/mysqljs/mysql#pool-options), 
and the following optional properties specific to this lib.

| Parameter    | Type          | Description   | Default       |
| ----------   | ------------- | ------------- | ------------- | 
| freeze       | boolean       | Freeze the database schema. | `false` |
| underscore   | boolean       | Use underscore for relationship linking columns. e.g `table_id` else its `tableId` | `true` |

Or you can pass in an existing pool:

``` javascript
const Database = new(require('...'))({
    database: '...',
    freeze: false,
    underscore: true
}, pool);
```

### Example

A super simple CRUD example!

**Note:** If you dont call `Database.connect()` then it will *try* to connect but you will not be able to catch any connection issues.


``` javascript
Database.connect().then(async () => {
    console.log('Database is ready')

    // Create & Store
    let post = new Database.row('post', {
      title: 'Hello World'
    })
    await post.store()

    // Retrieve
    post = await Database.load('post', post.id)

    // Update
    post.body = 'Lorem ipsum dolor sit amet.'
    await post.store()

    // Delete
    await post.delete()

}).catch(err => {
    console.log('Error: ', err)
})
```

Yep, it's really that simple!

For complete details and further examples head over to the docs.

# CRUD

## Initialize a new row

Declare a row object and assign your properties:

- `Database.row(table, properties)`

**Arguments:**

| Parameter    | Type          | Description   | |
| ----------   | ------------- | ------------- | ------------- | 
| table        | string        | Table name in which you want to store the row. | required |
| properties   | object        | An object with the rows properties, nested properties are JSON stringified. | |

``` javascript
let person = new Database.row('person', {
    name: 'lozza',
    created: new Date(),
    meta: {
        last_seen: new Date()
    }
});
    
// and/or properties can also be added after initialization:
let person = new Database.row('person');
person.name = 'lozza';
person.created = new Date();
person.meta = {
    last_seen: new Date()
};
```

## Create/Update

Creating and updating the row is done by calling the `.store()` function, if the row has an `id` that exists in the table it will update the row, else it will add a new row.

``` javascript
person.store().then(() => {
    console.log(person);
});
```

You can also modify the user row and then store it to update the row:

``` javascript
person.store().then(() => {
    person.name = 'loz';
    person.updated = new Date();
    person.store(() => {
        console.log(person);
    });
});
```

A more advanced example, which links emails and tags to users.

``` javascript
person.store().then(() => {

    // emails (one to many)
    var emails = [
        { type: 'personal', value: 'loz@example.com' },
        { type: 'work', value: 'office@example.com' }
    ];
    Database.storeRows('email', emails).then(emails => {
        // link emails to person
        person.addChildren('email', emails).then(emails => {
            console.log('emails', emails);
        });
    });

    // tags (many to many)
    const tags = [
       { name: 'books' },
       { name: 'cars' },
       { name: 'movies' }
    ];
    person.setLists('tag', tags).then(tags => {
        console.log('tags', tags);
    });
    
    // parent updated
    person.updated = new Date();
    person.store(() => {
        console.log(person);
    });
});
```

### Store multiple rows

There are two ways to store multiple rows at the same time:

- `storeAll(rows)`: Stores the given rows.

    **Arguments:**

    rows: *[array of rows]* The rows to be stored.

    ``` javascript
    var rows = [
        new Database.row('tag', { name: 'orm' }),
        new Database.row('person', { name: 'Steve', created: new Date() }),
        new Database.row('person', { name: 'Simon', created: new Date() })
    ];
    Database.storeAll(rows).then(function(res){
        console.log(res);
    });
    ```

- `storeRows(table, array)`: Stores the given rows in perticuler table.

    **Arguments:**

    table: *[string]* The table in which rows will be stored.
    array: *[array]* The objects to be stored.

    ``` javascript
        const comments = [
            { text: 'Easy peasy orm', posted: new Date() },
            { text: 'wonderful', posted: new Date() },
        ];
        Database.storeRows('comment', comments).then(function(res){
            console.log(res);
        });
        // output: [ { text: 'I like it', posted: 1467397814583, id: 1 },
        // { text: 'wonderful', posted: 1467397814583, id: 2 } ]
    ```
*Note That: In both functions if any row exist it will be updated*

## Read

To read data from DB there are 3 ways:

- `load(table,id)`: Loads a row.

    **Arguments:**

    table: *[string] --required* The table of the wanted row.

    id: *[integer] --required* The id of the wanted row.

    ``` javascript
        Database.load('user',6).then(function(user){
            console.log(user);
        });
        // output: { name: 'Omar', age: '53', registeredAt: 1467137605301, id: 6 }
    ```
    *If no record found it returns false*
    
- `find(table,data)`: this function returns an array of rows from a table.

    **Arguments:**

    table: *[string] --required* The table of the wanted row.
    sql: *[string]* All the sql you want to put after "WHERE" *(It's recommended to not put variables in this string, write `?` instead)*
    vals: *[array|simple]* The values that will replace the `?`s in order
    more:
    - parents: *[array|string]* The parents to join with the row
    - select: *[string]* String added after "SELECT"
    - manualSelect: *[boolean]* If set to true request will not select all table columns automatically *|| Default: children+'s'*

    ``` javascript
        Database.find('user',{sql:'age > ?',vals: 40}).then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
    If you want to **find all** rows, don't put conditions:

    ``` javascript
        Database.find('user').then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 },
        // { id: 7, name: 'AbuBakr', age: '36', registeredAt: null },
        // { id: 8, name: 'Ussama', age: '44', registeredAt: null } ]
    ```
    To get only some columns:

    ``` javascript
        Database.find('user',{sql:'age > ?',vals: 40,select: 'name,id',manualSelect: true}).then(function(users) {
            console.log(users);
        });
        // output: [ { id: 6, name: 'Omar' },
        // { id: 8, name: 'Ussama' } ]
    ```
- `findOne(table,data)`: this function works the same as `find` but returns only one row:

    ``` javascript
        Database.findOne('user',{sql:'age > ?',vals: 40}).then(function(user) {
            console.log(user);
        });
        // output: { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
    ```
## Delete
There are two ways to delete records:

- `.delete()`: this function deletes the row:

    ``` javascript
        // user = { id: 6, name: 'Omar', age: '53', registeredAt: 2147483647 }
        user.delete().then(function () {
            console.log('done!');
        });
    ```
- `delete(table,data)`: this function deletes from a table.

    **Arguments:**

    table: *[string] --required* The wanted table.

    data: *[object]*
    - sql: *[string]* All the sql you want to put after "WHERE" *(It's recommended to not put variables in this string, write `?` instead)*
    - vals: *[array|simple]* The values that will replace the `?`s in order

    ``` javascript
        Database.delete('user',{sql: 'age > ?',vals: 40},function() {
            Database.find('user',function(users) {
                console.log(users);
            });
        });
        // output: [ { id: 7, name: 'AbuBakr', age: '36', registeredAt: null } ]
    ```
    
# Relations (Family)

## One to many (Parent & Children)
You can add a property `tableName+'Id'` manually to make a row belong to another row. Or you can use this function:

- `.setParent(parent)`: Sets a parent to row.

    **Arguments:**

    parent: *[row] --required* The row to be set as parent.

    ``` javascript
        // comment = { id: 1, text: 'I like it', posted: 2147483647 }
        // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
        comment.setParent(user).then(function() {
            console.log(comment);
        });
        // output: { id: 1, text: 'I like it', posted: 2147483647, userId: 7 }
    ```
And you can get the parent using this:

- `.getParent(table)`: Returns the parent row.

    **Arguments:**

    table: *[string] --required* The parent row table.

    ``` javascript
        // comment = { id: 1, text: 'I like it', posted: 2147483647, userId: 7 }
        comment.getParent('user').then(function(user) {
            console.log(user);
        });
        // output: { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
    ```
If you have the parent and you want to append children to it do that:

- `.addChildren(table,array)`: Adds children to row.

    **Arguments:**

    table: *[string] --required* The children's table.

    array: *[array] --required*  The objects to be stored as children.

    ``` javascript
    // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
    // comments = [ { id: 1, text: 'I like it', posted: 2147483647, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2147483647, userId: null } ]
    user.addChildren('comment',comments).then(function(res) {
        comments = res;
        console.log(comments);
    });
    // output: [ { id: 0, text: 'I like it', posted: 2147483647, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2147483647, userId: 7 } ]
    ```
And to get children:

- `getChildren(table)`: Returns children of row.

    **Arguments:**

    table: *[string] --required*  The children's table.

    ``` javascript
        // user = { id: 7, name: 'AbuBakr', age: '36', registeredAt: null }
        user.getChildren('comment').then(function(comments) {
            console.log(comments);
        });
        // output: [ { id: 0, text: 'I like it', posted: 2147483647, userId: 7 },
        // { id: 2, text: 'wonderful', posted: 2147483647, userId: 7 } ]
    ```
## Many to many (Cousins)

*For the rest of the docs, we used an adapted copy of sakila database.*

In Tayr the many to many related tables are called cousins:

- `.getCousins(cousinsTable)`: Returns the cousins list.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    ``` javascript
    Database.load('film',790).then(function (film) {
        film.getCousins('actor').then(function (actors) {
            console.log(actors);
        });
    });
    // output: [ { id: 28, first_name: 'WOODY', last_name: 'HOFFMAN' },
    // { id: 47, first_name: 'JULIA', last_name: 'BARRYMORE' },
    // { id: 55, first_name: 'FAY', last_name: 'KILMER' } ]
    ```
- `.setCousins(cousinsTable,newCousins)`: Replace all the current cousins by the given cousins in array.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    newCousins: *[array] --required* An array of objects(not required to be rows).

    ``` javascript
    Database.load('film',790).then(function (film) {
        var array = [
            { first_name: 'JOHN', last_name: 'CENA' },
            { first_name: 'GARRY', last_name: 'LEWIS' },
        ];
        film.setCousins('actor',array).then(function (actors) {
            console.log(actors);
        });
    });
    // output: [ { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' } ]
    ```
- `.addCousins(cousinsTable,newCousins)`: Works the same as `.setCousins` but without deleting the recorded cousins.

    **Arguments:**

    cousinsTable: *[string] --required* The cousins table name.

    newCousins: *[array] --required* An array of objects(not required to be rows).

    ``` javascript
    Database.load('film',790).then(function (film) {
        var array = [
            { first_name: 'PETER', last_name: 'MALCOLM' },
            { first_name: 'SAMUEL', last_name: 'HADINBOURG' },
        ];
        film.addCousins('actor',array).then(function (newActors) {
            film.getCousins('actor').then(function (actors) {
                console.log(actors);
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' } ]
    ```
- `.addCousin(cousin)`: Add a single cousin to a row.

    **Arguments:**

    cousin: *[row] --required* The cousin to be added.

    ``` javascript
    Database.load('film',790).then(function (film) {
        var actor = new Database.row('actor',{ first_name: 'FRED', last_name: 'HAMILTON' });
        film.addCousin(actor).then(function () {
            film.getCousins('actor').then(function (actors) {
                console.log(actors);
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' },
    // { id: 217, first_name: 'FRED', last_name: 'HAMILTON' } ]
    ```
- `.removeCousin(cousin)`: Removes the cousinity(relation) between the two rows.

    **Arguments:**

    cousin: *[row] --required* The cousin to be unrelated.

    ``` javascript
    Database.load('film',790).then(function (film) {
        Database.load('actor',217).then(function (actor) {
            film.removeCousin(actor).then(function () {
                film.getCousins('actor').then(function (actors) {
                    console.log(actors);
                });
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' } ]
    ```

*Note: In case you want to know whats the intermediate table name between two tables you can use this:*
``` javascript
Database.getUncleTableName(table1,table2);
// for table1 = 'film' and table2 = 'actor'
// it returns 'actor_film'
```

# Datatypes

These are the supported types, any other type can may errors.

- `integer`: INT
- `decimal`: DOUBLE
- `boolean`: BOOL
- `string` : VARCHAR (if length < 256) | TEXT (if length > 255)
- `Date`   : DATETIME (parsed on select)
- `json`   : TEXT (stringified on insert, parsed on select)

# Helpers

## Counting

- `Database.count(table, data)`: Returns the number of rows found.

    **Arguments:**

    table: *[string] --required* The table from which it will count.
    sql: *[string]* Filter
    vals: *[array|simple]*  Values that will replace `?` in `sql` property

    ``` javascript
    Database.count('film', 'length > ?', [60]).then(function(res) {
        console.log(res);
    });
    // output: 896
    ```

## Executing MySQL

- `Database.query(sql, vals)`: Allows you to execute any MySQL query.

    **Arguments:**

    sql: *[string] --required* SQL code.

    vals: *[array|simple]*  Values that will replace `?` in `sql` property

    ``` javascript
    Database.query('SELECT title FROM film WHERE length < ?',47).then(function(res) {
        console.log(res);
    });
    // output: [ RowDataPacket { title: 'ALIEN CENTER' },
    // RowDataPacket { title: 'IRON MOON' },
    // RowDataPacket { title: 'KWAI HOMEWARD' },
    // RowDataPacket { title: 'LABYRINTH LEAGUE' },
    // RowDataPacket { title: 'RIDGEMONT SUBMARINE' } ]
    ```

## Converting array to rows

- `Database.arrayToRows(table, array)`: Transforms an array of simple objects to an array of rows.

    **Arguments:**

    table: *[string] --required* The table of the future rows.

    array: *[array] --required* The array of object to be transformed.

    ``` javascript
        var comments = [
            {text: 'First comment!', postedAt: new Date()},
            {text: 'Stop these stupid comments please!', postedAt: new Date()},
            {text: 'Keep Calm', postedAt: new Date()},
        ];
        console.log(comments[0].table); // output: undefined
        comments = Database.arrayToRows('comment',comments);
        console.log(comments[0].table); // output: comments
    ```
    
## Testing

Your need to change `./tests/test.js` and install [mocha](https://mochajs.org), then run:

``` bash
$ npm test
```

## Contributing

Please see [CONTRIBUTING](https://github.com/lcherone/autorm/blob/master/CONTRIBUTING.md) for details.

## Developer Support / Sponsor

If you want to show your appreciation, please feel free to make a donation [https://www.paypal.me/lcherone](https://www.paypal.me/lcherone), thanks.

## Credits

- [Lawrence Cherone](https://github.com/lcherone)
- [All Contributors](https://github.com/lcherone/autorm/graphs/contributors)

## License

The MIT License (MIT). Please see [License File](https://github.com/lcherone/autorm/blob/master/LICENSE) for more information.
