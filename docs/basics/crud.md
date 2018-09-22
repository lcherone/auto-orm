# Create, Retrieve, Update & Delete

## Create

Initialize a new row and assign your properties.

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

// and/or properties can be added after initialization:
let person = new Database.row('person');
person.name = 'lozza';
person.created = new Date();
person.meta = {
    last_seen: new Date()
};
```

**Response**
``` json
{
  "name": "lozza",
  "created": "2018-09-16T09:36:12.880Z",
  "meta": {
    "last_seen": "2018-09-16T09:36:12.880Z"
  }
}
```

## Store (Create, Update)

Creating the new row or updating an existing row is done by calling the `.store()` function.

``` javascript
person.store().then(() => {
    console.log(person);
});
```

You can also modify the row and then store it to update the row:

``` javascript
person.store().then(() => {
    person.name = 'loz';
    person.updated = new Date();
    person.store(() => {
        console.log(person);
    });
});
```

**Response**
``` json
{
  "name": "lozza",
  "created": "2018-09-16T09:39:05.000Z",
  "meta": {
    "last_seen": "2018-09-16T09:39:05.976Z"
  },
  "id": 1
}
```

A more advanced example, which links emails and tags to the person:

``` javascript
person.store().then(() => {

    // emails (one to many)
    let emails = [
        { type: 'personal', value: 'loz@example.com' },
        { type: 'work', value: 'office@example.com' }
    ];
    Database.storeRows('email', emails).then(emails => {
        // link emails to person
        person.addChildren('email', emails).then(emails => {
            console.log('emails', emails);
        });
    });

    // tags/lists (many to many)
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

| Parameter    | Type          | Description   | |
| ----------   | ------------- | ------------- | ------------- |
| rows         | array         | An array of database rows. | required |


``` javascript
let rows = [
    new Database.row('tag', { name: 'orm' }),
    new Database.row('person', { name: 'Anna', created: new Date() }),
    new Database.row('person', { name: 'Elon', created: new Date() })
];
Database.storeAll(rows).then(rows => {
    console.log(rows);
});
```

**Response**
``` json
[
  {
    "name": "orm",
    "id": 1
  },
  {
    "name": "Anna",
    "created": "2018-09-16T09:59:31.000Z",
    "id": 1
  },
  {
    "name": "Elon",
    "created": "2018-09-16T09:59:31.000Z",
    "id": 2
  }
]

```

- `storeRows(table, rows)`: Stores the given rows in perticuler table.

**Arguments:**

| Parameter    | Type          | Description   | |
| ----------   | ------------- | ------------- | ------------- |
| table        | string        | The table in which rows will be stored. | required |
| rows         | array         | The objects to be stored. | required |

``` javascript
const comments = [
    { text: 'Easy peasy orm', posted: new Date() },
    { text: 'Sweet!', posted: new Date() },
];
Database.storeRows('comment', comments).then(rows => {
    console.log(rows);
});
```

*Note:* If any row exist it will be updated.

## Retrieve

To read data from the database there are 3 ways:

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
// { id: 8, name: 'Ussama', age: '44', registeredAt: null } 
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

### Delete

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
