# grunt-loopback-deploy

> Automate loopback application version numbering and deployment to production server

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-loopback-deploy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-loopback-deploy');
```

## The "loopback_deploy" task

### Overview
In your project's Gruntfile, add a section named `deploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  deploy: {
    options: {
      deploySLCPMServerURL: 'http://your.production.server:slc pm port/repo'
    }
  },
});
```

### Required Options

#### options.deploySLCPMServerURL
Type: `String`
Default value: none
Example: 'http://www.myproductionserver.com:7777/repo'

This is the url of the server you are deploying to. See [Loopback SLC PM Docs](http://docs.strongloop.com/display/SLC/Installing+Process+Manager+as+a+service) to learn how to setup your server to receive deployment packages

### Usage Examples

Once you install the npm package and edit your Gruntfile you can simply type
```shell
grunt deploy:patch
```
to deploy to your server.

## Release History
_(Nothing yet)_
