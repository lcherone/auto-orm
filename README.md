
# Autorm

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
const database = new(require('...'))({
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
and with the following optional properties specific to this lib.

| Parameter  | Type    | Description | Default |
| ---------- | ------- | ----------- | ------- |
| freeze     | boolean | Freeze the database schema.                                                        | `false` |
| underscore | boolean | Use an underscore for relationship linking columns. e.g `table_id` else its `tableId` | `true`  |

Or you can pass in an existing pool, with the following options:

``` javascript
const database = new(require('...'))({
    database: '...',
    freeze: false,
    underscore: true
}, pool);
```

### Example

A super simple CRUD example!

``` javascript
database.connect().then(async () => {
    console.log('database is ready')

    // Create & Store
    let post = new database.row('post', {
      title: 'Hello World'
    })
    await post.store()

    // Retrieve
    post = await database.load('post', post.id)

    // Update
    post.body = 'Lorem ipsum dolor sit amet.'
    await post.store()

    // Delete
    await post.delete()

}).catch(err => {
    console.log('Error: ', err)
})
```

Yep, it's that simple!

## CRUD

### Create a new row

Declare a new row object and assign your properties.

- `database.row(table, properties)`

**Arguments:**

| Parameter  | Type   | Description                                                                 |          |
| ---------- | ------ | --------------------------------------------------------------------------- | -------- |
| table      | string | Table name in which you want to store the row.                              | required |
| properties | object | An object with the properties of the row, nested properties are JSON stringified. |          |

``` javascript
let person = new database.row('person', {
    name: 'lozza',
    created: new Date(),
    meta: {
        last_seen: new Date()
    }
});
    
// and/or properties can also be added after initialization:
let person = new database.row('person');
person.name = 'lozza';
person.created = new Date();
person.meta = {
    last_seen: new Date()
};
```

### Create/Update

Storing a row, either by initial new database.row or updating an existing the row is done by calling the `.store()` function, if the row has an `id` that exists in the table it will update the row, else it will add a new row.

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
    database.storeRows('email', emails).then(emails => {
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

### Merge

Another way to update is to merge your updated values.

``` javascript
person.merge({
    name: 'New name'
}).then(person => {
    person.store()
});
```

### Store multiple rows

There are two ways to store multiple rows at the same time:

 - **`storeAll(rows)`**:  Stores an array of rows.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | rows      | array | The rows to be stored. |

    ``` javascript
    var rows = [
        new database.row('tag', { name: 'orm' }),
        new database.row('person', { name: 'Steve', created: new Date() }),
        new database.row('person', { name: 'Simon', created: new Date() })
   ];
   database.storeAll(rows).then(result){
        console.log(result);
   });
   ```

 - **`storeRows(table, array)`**:  Stores an array of objects.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table in which rows will be stored. |
    | array      | array | The objects to be stored. |

    ``` javascript
    const comments = [
        { text: 'Easy peasy orm', posted: new Date() },
        { text: 'cool', posted: new Date() }
    ];
    
    database.storeRows('comment', comments).then(function(result){
        console.log(result);
    });
    ```

## Read

To read data from the database there are 3 ways:

- **`load(table, id)`**: Loads a row by id.

    **Arguments:**
    
    | Parameter  | Type   | Description | 
    | ---------- | ------ | -------- | 
    | table      | string | The table of the wanted row. | 
    | id      | integer | The id of the wanted row. |
    
    ``` javascript
    database.load('user', 6).then(user => {
        console.log(user);
    });
    ```
    *If no record found it returns false*
    
- **`find(table, sql, values, extra)`**: Find rows from a table.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table of the wanted row. |
    | sql      | string | SQL you want to put after the WHERE clause. |
    | values      | array|simple | The values that will replace the `?`s in order. |
    | extra      | object | `{ fields: [], parents: [], children: [], child: [], lists: [] }`  |


    ``` javascript
    database.find('user', 'name = ?', ['Adam']).then(users => {
        console.log(users[0].name); // Adam
    });
    ```

    If you want to **find all** rows, don't put conditions:

    ``` javascript
    database.find('user').then(function(users) {
        console.log(users);
    });
    ```
    
    By default its `SELECT *`, to get only some columns, use extra with defined fields:

    ``` javascript
    database.find('user', 'name = ?', ['Adam'], { fields: ['name'] }).then(function(users) {
        console.log(users[0].name); // Adam
    });
    ```

- **`findOne(table,data)`**: this function works the same as `find` but returns only one row:

    ``` javascript
    database.findOne('user', 'name = ?', ['Adam'], { fields: ['name'] }.then(user => {
        console.log(user.name);
    });
    ```
    
## Delete

There are two ways to delete records:

- **`.delete()`**: this function deletes the row:

    ``` javascript
        // user = { id: 6, name: 'Adam', age: '63', created: 2163717392 }
        user.delete().then(function () {
            console.log('deleted!');
        });
    ```
- **`delete(table, data)`**: this function deletes from a table.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table of the wanted row. |
    | sql      | string | SQL you want to put after the WHERE clause. |
    | values      | array|simple | The values that will replace the `?`s in order. |


    ``` javascript
    database.delete('user', 'name = ?', ['Adam']).then(() => {
        console.log('deleted');
    });
    ```
    
## Relations

Below are some helper functions for simple relationship linking based on ids, be aware the lib does not set up foreign keys between tables on the database.

### One to many (Parent & Children)

You can add a property like `tableName + '_id'` manually to make a row belonging to another row. 

Or you can use this function:

- **`.setParent(parent)`**: Sets a parent to row.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | parent      | row|object | The row to be set as parent. |

    ``` javascript
    // comment = { id: 1, text: 'I like it', posted: 2163717392 }
    // user = { id: 7, name: 'Steve', age: '36', created: null }
    comment.setParent(user).then(() => {
        console.log(comment);
    });
    // output: { id: 1, text: 'I like it', posted: 2163717392, userId: 7 }
    ```

You can get the parent using this:

- **`.getParent(table)`**: Returns the parent row.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The parent row table. |

    ``` javascript
    // comment = { id: 1, text: 'I like it', posted: 2163717392, userId: 7 }
    comment.getParent('user').then(function(user) {
        console.log(user);
    });
    // output: { id: 7, name: 'Steve', age: '36', created: null }
    ```

If you have the parent and you want to append children to it do that:

- **`.addChildren(table,array)`**: Adds children to row.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The children's table. |
    | rows       | array | The rows to be stored as children. |

    ``` javascript
    // user = { id: 7, name: 'Steve', age: '36', created: null }
    // comments = [ { id: 1, text: 'I like it', posted: 2163717392, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2163717392, userId: null } ]
    user.addChildren('comment', comments).then(result => {
        console.log(result);
    });
    // output: [ { id: 0, text: 'I like it', posted: 2163717392, userId: 7 },
    // { id: 2, text: 'wonderful', posted: 2163717392, userId: 7 } ]
    ```

And to get children:

- **`getChildren(table)`**: Returns children of row.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The children's table. |

    ``` javascript
        // user = { id: 7, name: 'Steve', age: '36', created: null }
        user.getChildren('comment').then(function(comments) {
            console.log(comments);
        });
        // output: [ { id: 0, text: 'I like it', posted: 2163717392, userId: 7 },
        // { id: 2, text: 'wonderful', posted: 2163717392, userId: 7 } ]
    ```

### Many to many


- **`.getLists(table)`**: Returns the lists list.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The lists table name. |

    ``` javascript
    database.load('film',790).then(function (film) {
        film.getLists('actor').then(function (actors) {
            console.log(actors);
        });
    });
    // output: [ { id: 28, first_name: 'WOODY', last_name: 'HOFFMAN' },
    // { id: 47, first_name: 'JULIA', last_name: 'BARRYMORE' },
    // { id: 55, first_name: 'FAY', last_name: 'KILMER' } ]
    ```

- **`.setlists(table, newlists)`**: Replace the current list by the given array.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The lists table name. |
    | newlists   | array  | An array of objects (not required to be rows). |

    ``` javascript
    database.load('film',790).then(film => {
        var actors = [
            { first_name: 'JOHN', last_name: 'CENA' },
            { first_name: 'GARRY', last_name: 'LEWIS' },
        ];
        film.setlists('actor', actors).then(actors => {
            console.log(actors);
        });
    });
    // output: [ { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' } ]
    ```

- **`.addlists(table, newlists)`**: Works the same as `.setlists` but without deleting the recorded lists.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The lists table name. |
    | newlists   | array  | An array of objects (not required to be rows). |

    ``` javascript
    database.load('film',790).then(function (film) {
        var array = [
            { first_name: 'PETER', last_name: 'MALCOLM' },
            { first_name: 'SAMUEL', last_name: 'HADINBOURG' },
        ];
        film.addlists('actor',array).then(function (newActors) {
            film.getLists('actor').then(function (actors) {
                console.log(actors);
            });
        });
    });
    // output: [ { id: 215, first_name: 'PETER', last_name: 'MALCOLM' },
    // { id: 214, first_name: 'GARRY', last_name: 'LEWIS' },
    // { id: 213, first_name: 'JOHN', last_name: 'CENA' },
    // { id: 216, first_name: 'SAMUEL', last_name: 'HADINBOURG' } ]
    ```

- **`.addList(list)`**: Add a single list to a row.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | item      | row | The list item to be added. |
    | newlists   | array  | An array of objects (not required to be rows). |

    ``` javascript
    database.load('film', 790).then(function (film) {
        var actor = new database.row('actor',{ first_name: 'FRED', last_name: 'HAMILTON' });

        film.addlist(actor).then(function () {
            film.getLists('actor').then(function (actors) {
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

- **`.removeList(list)`**: Removes the listity(relation) between the two rows.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | item      | row | The list item to be unlinked. |


    ``` javascript
    database.load('film', 790).then(function (film) {
        database.load('actor', 217).then(function (actor) {
            film.removelist(actor).then(function () {
                film.getLists('actor').then(function (actors) {
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

**Note:** 

In case you want to know whats the intermediate table name between two tables you can use this:

``` javascript
database.getlinkTable(table1, table2);
// for table1 = 'film' and table2 = 'actor'
// it returns 'actor_film'
```

## Datatypes

These are the supported types, any other type may cause undesired results.

- `integer`: INT
- `decimal`: DOUBLE
- `boolean`: BOOL
- `string` : VARCHAR (if length < 256) | TEXT (if length > 255)
- `Date`   : DATETIME (parsed on select)
- `object` : TEXT (JSON.stringified on insert, JSON.parse'd on select)

## Helpers

### Counting

- `database.count(table, data, values)`: Returns the number of rows found.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table of the wanted row. |
    | sql      | string | SQL you want to put after the WHERE clause. |
    | values      | array|simple | The values that will replace the `?`s in order. |

    ``` javascript
    database.count('film', 'length > ?', [60]).then(function(res) {
        console.log(res);
    });
    // output: 896
    ```

### Executing raw MySQL

- `database.query(sql, values)`: Allows you to execute any MySQL query.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table of the wanted row. |
    | sql        | string | SQL you want to put after the WHERE clause. |
    | values     | array|simple | The values that will replace the `?`s in order. |

    ``` javascript
    database.query('SELECT title FROM film WHERE length < ?', 47).then(result => {
        console.log(res);
    });
    // output: [ RowDataPacket { title: 'ALIEN CENTER' },
    // RowDataPacket { title: 'IRON MOON' },
    // RowDataPacket { title: 'KWAI HOMEWARD' },
    // RowDataPacket { title: 'LABYRINTH LEAGUE' },
    // RowDataPacket { title: 'RIDGEMONT SUBMARINE' } ]
    ```

- `database.exec(sql, vals)`: alias of query.

### Converting array to rows

- `database.arrayToRows(table, array)`: Transforms an array of simple objects to an array of rows.

    **Arguments:**

    | Parameter  | Type   | Description
    | ---------- | ------ | -------- |
    | table      | string | The table to assign to rows. |
    | array      | array | The array of objects to be transformed into rows. |

    ``` javascript
        var comments = [
            { text: 'First comment!', created: new Date() },
            { text: 'Hi!', created: new Date() }
        ];
        console.log(comments[0].table); // output: undefined
        comments = database.arrayToRows('comment', comments);
        console.log(comments[0].table); // output: comments
    ```
    
## Testing

You need to change `./tests/test.js` and install [mocha](https://mochajs.org), then run:

``` bash
$ npm test
```

## Contributing

Please see [CONTRIBUTING](https://github.com/lcherone/autorm/blob/master/CONTRIBUTING.md) for details.

## Developer Support / Sponsor

If you want to show your appreciation, please feel free to donate [https://www.paypal.me/lcherone](https://www.paypal.me/lcherone), thanks.

## Credits

- [Lawrence Cherone](https://github.com/lcherone)
- [All Contributors](https://github.com/lcherone/autorm/graphs/contributors)

## License

The MIT License (MIT). Please see [License File](https://github.com/lcherone/autorm/blob/master/LICENSE) for more information.
