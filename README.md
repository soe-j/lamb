# lamb

## install
### global
```shell
$ npm i soe-j:lamb -g
```

### in Directory
```shell
$ npm i soe-j:lamb
```

## usage
### generate
```shell
$ npx lamb generate awesome-function

# -> awesome-function/index.js       # todo implement
# -> awesome-function/lamb.config.js # todo configure
```

### develop
```shell
$ cd awesome-function
$ npm init
# add package you want to package.json
$ npm i

# develop
```

### run on local
```shell
$ npx lamb run awesome-function
```

### create function
```shell
$ npx lamb create awesome-function [favorite env ex.staging]
# -> create function awesome-function-[favorite env ex.staging]

$ npx lamb create awesome-function production
# -> create function awesome-function (nothing suffix)
```

### update function
```shell
$ npx lamb update awesome-function [favorite env ex.staging]
# -> update function awesome-function-[favorite env ex.staging]
```

### invoke function
```shell
$ npx lamb invoke awesome-function [favorite env ex.staging]
# -> invoke function awesome-function-[favorite env ex.staging]
```
