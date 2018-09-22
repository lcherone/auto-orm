/* eslint new-cap: ["error", { "newIsCap": false }] */

// process.env.DEBUG = '*'

const dbData = {
  host: '127.0.0.1',
  user: 'app',
  password: 'MjRmNmQ3YzlmY2Q2YmNlNGI1NDI3YTVh',
  database: 'app'
}

/* eslint-disable */
const assert = require('assert')
const should = require('should')
/* eslint-enable */

let Database
let person

function dropDatabase (callback) {
  const mysql = require('mysql')
  const dbName = dbData.database
  delete dbData.database
  const connection = mysql.createConnection(dbData)
  connection.connect()
  connection.query('DROP DATABASE IF EXISTS ' + dbName, () => {
    dbData.database = dbName
    callback()
  })
}

function setupTest () {
  describe('SETUP', function () {
    it('should drop the database if exists', done => {
      dropDatabase(() => {
        done()
      })
    })
    it('should create an library instance', done => {
      Database = new (require('../src/index.js'))(dbData)
      assert.equal(true, (typeof Database === 'object'))
      done()
    })
  })
  describe('CONNECT', function () {
    it('should connect to the database', done => {
      Database.connect().then(() => {
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
  describe('CREATE', function () {
    it('should create a row instance', done => {
      person = new Database.row('person', {
        name: 'lozza',
        created: new Date(),
        meta: {
          sub_object: {value: 'foobar'},
          last_seen: new Date()
        }
      })
      done()
    })
    it('should store row', done => {
      person.store().then(() => {
        person.should.have.property('id')
        console.log('      Insert id: ', person.id)
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
}

const isObject = function (val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false
}

/**
 * Tests
 */

/*
** Instant CRUD
*/
describe('- Instant CRUD -', function () {
  describe('SETUP', function () {
    it('should drop the database if exists', done => {
      dropDatabase(() => {
        done()
      })
    })
    it('should create an library instance', done => {
      Database = new (require('../src/index.js'))(dbData)
      assert.equal(true, (typeof Database === 'object'))
      done()
    })
  })
  describe('Example', function () {
    it('should run example', done => {
      // connect
      Database.connect().then(async () => {
        console.log('     - Database is ready')

        // Create & Store
        console.log('     - Creating row')
        let post = new Database.row('post', {
          title: 'Hello World'
        })
        post.should.have.property('title', 'Hello World')

        console.log('     - Storing row')
        await post.store()
        post.should.have.property('id')

        // Retrieve
        console.log('     - Retrieving row')
        post = await Database.load('post', post.id)
        post.should.have.property('title', 'Hello World')

        // Update
        console.log('     - Updating row')
        post.body = 'Lorem ipsum dolor sit amet.'
        await post.store()
        post.should.have.property('body', 'Lorem ipsum dolor sit amet.')

        // Delete
        console.log('     - Deleting row')
        await post.delete()

        done()
      }).catch(err => {
        console.log('     - Error: ', err)
        done(err)
      })
    })
  })
  describe('Docs', function () {
    it('should run example', done => {
      // connect
      Database.connect().then(async () => {
        console.log('     - Database is ready')

        let rows = [
          new Database.row('tag', { name: 'orm' }),
          new Database.row('person', { name: 'Anna', created: new Date() }),
          new Database.row('person', { name: 'Elon', created: new Date() })
        ]
        await Database.storeAll(rows).then(rows => {
          console.log(JSON.stringify(rows, null, 2))
        })

        done()
      }).catch(err => {
        console.log('     - Error: ', err)
        done(err)
      })
    })
  })
})

/*
** Basic CRUD tests
*/
describe('- Basic CRUD -', function () {
  setupTest()

  describe('READ', function () {
    it('should return the created person', done => {
      Database.load('person', person.id).then(result => {
        assert.deepEqual(person, result)
        console.log('      Insert id: ', result.id)
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
  describe('UPDATE', function () {
    it('should return the updated person', done => {
      person.age = 35
      person.store().then(() => {
        return Database.load('person', person.id)
      }).then(result => {
        assert.equal(result.age, 35)
        console.log('      new age: ', result.age)
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should add new property to person', done => {
      person.updatedAt = new Date()
      person.store().then(() => {
        return Database.load('person', person.id)
      }).then(result => {
        result.should.have.property('updatedAt')
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
  describe('DELETE', function () {
    it('should return empty object', done => {
      person.delete().then(() => {
        return Database.load('person', person.id)
      }).then(result => {
        assert.deepEqual(result, {})
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
})

/*
** Finding
*/
describe('- Finding -', function () {
  setupTest()

  describe('FIND', function () {
    it('should find(\'person\', \'id = ?\', 1) row and return array', done => {
      Database.find('person', 'id = ?', 1).then(result => {
        assert.equal(Array.isArray(result), true, 'result is not an array')
        assert.equal(result.length, 1, 'result is empty, did not find row')
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should find(\'person\', \'id = ?\', [1]) row and return array', done => {
      Database.find('person', 'id = ?', [1]).then(result => {
        assert.equal(Array.isArray(result), true, 'result is not an array')
        assert.equal(result.length, 1, 'result is empty, did not find row')
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should find(\'person\', \'id = ?\', [1], {fields: [\'name\', \'meta\']}) row and return array', done => {
      Database.find('person', 'id = ?', [1], {fields: ['name', 'meta']}).then(result => {
        assert.equal(Array.isArray(result), true, 'result is not an array')
        assert.equal(result.length, 1, 'result is empty, did not find row')
        assert.equal(result[0].id, undefined, 'result.id is defined when it shouldnt be')
        assert.equal(result[0].name, 'lozza')
        assert.equal(result[0].meta.sub_object.value, 'foobar', 'meta.sub_object.value is not foobar')
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should findOne(\'person\', \'id = ?\', 1) row and return object', done => {
      Database.findOne('person', 'id = ?', 1).then(result => {
        assert.equal(isObject(result), true, 'result is not an object')
        assert.equal(result.id, 1, 'result is empty, did not find row')
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should findOne(\'person\', \'id = ?\', [1]) row and return object', done => {
      Database.findOne('person', 'id = ?', [1]).then(result => {
        assert.equal(isObject(result), true, 'result is not an object')
        assert.equal(result.id, 1, 'result is empty, did not find row')
        done()
      }).catch(err => {
        done(err)
      })
    })
    it('should findOne(\'person\', \'id = ?\', [1], {fields: [\'name\', \'meta\']}) row and return object', done => {
      Database.findOne('person', 'id = ?', [1], {fields: ['name', 'meta']}).then(result => {
        assert.equal(isObject(result), true, 'result is not an object')
        assert.equal(result.id, undefined, 'result.id is defined when it shouldnt be')
        assert.equal(result.name, 'lozza')
        assert.equal(result.meta.sub_object.value, 'foobar', 'meta.sub_object.value is not foobar')
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
})

/*
** Relationships
*/
describe('- Relationships -', function () {
  setupTest()
  describe('PARENT', function () {
    it('should create a child row and attach to parent', done => {
      let phone = new Database.row('phone', {
        number: '01234567890'
      })

      phone.setParent(person).then(phone => {
        // got id
        phone.should.have.property('id')
        // link property
        phone.should.have.property('person_id')
        // link is parent
        assert.equal(phone.person_id, person.id)

        done()
      }).catch(err => {
        done(err)
      })
    })
  })
  describe('PARENT CHILD', function () {
    it('should load parent and child', done => {
      Database.load('person', person.id, {child: ['phone']}).then(result => {
        result.should.have.property('phone')
        assert.equal(isObject(result.phone), true, 'result.phone is not an object')
        assert.equal(result.phone.number, '01234567890')
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
  describe('PARENT CHILDREN', function () {
    it('should load parent and all children', done => {
      Database.load('person', person.id, {children: ['phone']}).then(result => {
        assert.equal(Array.isArray(result.phone), true, 'result.phone is not an array')
        assert.equal(result.phone.length, 1)
        assert.equal(result.phone[0].number, '01234567890')
        done()
      }).catch(err => {
        done(err)
      })
    })
  })
})

describe('Testing', function () {
  describe('END PROCESS', function () {
    it('should stop node process', done => {
      done()
    })
  })
})

// console.log(Database)

/*
Database.reset().then(result => {
    let person = new Database.row('person', {
        name: 'lozza',
        created: new Date(),
        meta: {
            last_seen: new Date()
        }
    });
    person.store()
    debug('2', result)
})
Database.reset().then(result => {
    let person = new Database.row('person', {
        name: 'lozza',
        created: new Date(),
        meta: {
            last_seen: new Date()
        }
    });
    person.store()
    debug('3', result)
})
*/

// Database.reset().then(() => {

//     // create
//     let person = new Database.row('person', {
//         name: 'lozza',
//         created: new Date(),
//         meta: {
//             last_seen: new Date()
//         }
//     });

//     person.store().then(() => {

//         // emails (one to many)
//         var emails = [
//             { type: 'personal', value: 'loz@example.com' },
//             { type: 'work', value: 'office@example.com' }
//         ];
//         Database.storeRows('email', emails).then(emails => {
//             // link emails to user
//             person.addChildren('email', emails).then(emails => {
//                 console.log('emails', emails);
//             });
//         });

//         /*
//         // tags (many to many)
//         const tags = [
//             { name: 'books' },
//             { name: 'cars' },
//             { name: 'movies' }
//         ];
//         person.setLists('tag', tags, true).then(tags => {
//             debug('tags', tags);
//         });
//         */

//         // parent updated
//         person.updated = new Date();
//         person.store(() => {
//             debug(person);
//         });
//     });

// })

// var user = new Database.row('user', {
//     name: 'Lawrence'
// });
// person.sex = 'male';
// person.store();
// debug(user)

// Database.findOrCreate('user', {
//     name: 'Lawrence',
//     sex: 'male'
// }).then(function(row) {
//     debug(row);
// }).catch(err => {debug(err)})

// Database.findOne('user', 'name = ?', ['Lawrence']).then(function(users) {
//     debug('Database.find', users);
// });

// Database.count('user', 'id = ?', [1]).then(function(users) {
//     debug('Database.find', users);
// }).catch(err => {
//     console.log(err)
// });

// // read (by id)

// Database.load('user', 1).then(function(user) {

//     person.date = new Date()
//     person.json = {
//         foo: 'barx',
//         nestedDate: new Date()
//     }
//     person.store();

//     var email = [
//         { type: 'personal', value: 'lawrence@cherone.co.uk' },
//         { type: 'workggggg', value: 'office@cherone.co.uk', nested: {yup: 'value'} }
//     ];
//     person.setLists('email', email).then(function (actors) {
//         //debug('setLists', actors);

//         Database.getSchema().then(schema => debug(schema)).catch(err => {
//     console.log(err)
// })
//     });

//     person.getLists('email').then(function (actors) {
//         debug('getLists', actors);
//     });

//     Database.getSchema().then(schema => debug(schema)).catch(err => {
//     console.log(err)
// })

//     debug(user);
// }).catch(err => {
//     console.log(err)
// });

/*
//
Database.find('user', 'name = ?', ['Lawrence']).then(function(users) {
    debug('Database.find', users);
});
*/
