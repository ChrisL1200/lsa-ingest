#  [![Build Status](https://secure.travis-ci.org/ChrisL1200/lsa-ingest.png?branch=master)](http://travis-ci.org/ChrisL1200/lsa-ingest)

> The best module ever.


## Getting Started

Place all boundary data files into data/boundary/.
Place all education data files into data/education/.

## Ingesting Education Data

```sh
$ node app.js ingest=schools
```

## Ingesting Homes Data

```sh
$ node app.js ingest=homes
```

## LSA Score Calculator

```sh
$ node app.js ingest=scores
```

## Ingesting to production

```sh
$ node app.js ingest=schools env=prod
$ node app.js ingest=homes env=prod
$ node app.js ingest=scores env=prod
```

## Documentation

_(Coming soon)_


## Examples

_(Coming soon)_


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014   
Licensed under the MIT license.
