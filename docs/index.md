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
