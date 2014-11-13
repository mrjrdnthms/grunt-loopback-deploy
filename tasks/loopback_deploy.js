/*
 * grunt-loopback-deploy
 * https://github.com/mrjrdnthms/grunt-loopback-deploy
 *
 * Copyright (c) 2014 mrjrdnthms
 * Licensed under the MIT license.
 */

// Much of the code below is borrowed from https://github.com/gruntjs/grunt-contrib-bump a great library to bump package.json and commit to git

'use strict';

var semver = require('semver');
var shell = require('shelljs');

module.exports = function(grunt) {

	grunt.registerTask('deploy', 'Automate loopback application version numbering and deployment to production server', function(mode) {
		// Set default options
		var options = this.options({
			filepaths: ['package.json'],
			syncVersions: true,
			commit: true,
			commitMessage: 'Bumping version to {%= version %}.',
			addAllToCommit: true,
			push: true,
			deployBranch: true,
			deploySLCPMServerURL: false,
			branchName: 'deploy_{%= version %}'
		});

		// Validate specified semver increment modes.
		if(!mode) {
			grunt.log.error('Error: no versioning type specified: e.g. grunt deploy:patch');
		}
		if(mode!=='major' && mode!=='minor' && mode!=='patch'){
			grunt.log.error('Error: Versioning mode is not supported. Valid modes are: major, minor, patch.');
		}
		//Check if deploying that we have a server url
		if(options.deployBranch && !options.deploySLCPMServerURL){
			grunt.log.error('Error: Delopy option true but no deploySLCPMServerURL provided.');
		}
		if (this.errorCount > 0) {
			throw new Error('Error: Cannot Proceed. Check your intial options');
		}

		// Normalize filepaths to array.
		var filepaths = Array.isArray(options.filepaths) ? options.filepaths : [options.filepaths];
		// Process JSON files, in-order.
		var versions = {};
		filepaths.forEach(function(filepath) {
			var o = grunt.file.readJSON(filepath);
			var origVersion = o.version;
			// If syncVersions is enabled, only grab version from the first file,
			// guaranteeing new versions will always be in sync.
			var firstVersion = Object.keys(versions)[0];
			if (options.syncVersions && firstVersion) {
				o.version = firstVersion;
			}
			var orig = o.version;
			var s = semver.parse(o.version);
			s.inc(mode);
			o.version = String(s);
			// Workaround for https://github.com/isaacs/node-semver/issues/50
			if (/-/.test(orig) && mode === 'patch') {
				o.version = o.version.replace(/\d+$/, function(n) { return n - 1; });
			}
			// If prerelease on an un-prerelease version, bump patch version first
			if (!/-/.test(orig) && mode === 'prerelease') {
				s.inc('patch');
				s.inc('prerelease');
				o.version = String(s);
			}
			if (versions[origVersion]) {
				versions[origVersion].filepaths.push(filepath);
			} else {
				versions[origVersion] = {version: o.version, filepaths: [filepath]};
			}
			// Actually *do* something.
			grunt.log.write('Bumping version in ' + filepath + ' from ' + origVersion + ' to ' + o.version + '...');
			grunt.file.write(filepath, JSON.stringify(o, null, 2));
			grunt.log.ok();
		});
		// Commit changed files?
		if (options.commit) {
			Object.keys(versions).forEach(function(origVersion) {
				var o = versions[origVersion];
				commit(o.filepaths, processTemplate(options.commitMessage, {
					version: o.version,
					origVersion: origVersion
				}),options.addAllToCommit);

				// Push Changes?
				if(options.push){
					push();
				}

				if(options.deployBranch){
					deployBranch(processTemplate(options.branchName, {
						version: o.version,
						origVersion: origVersion
					}), options.deploySLCPMServerURL);
				}
			});
		}

		if (this.errorCount > 0) {
			grunt.warn('There were errors.');
		}
	});

	// Using custom delimiters keeps templates from being auto-processed.
	grunt.template.addDelimiters('bump', '{%', '%}');

	function processTemplate(message, data) {
		return grunt.template.process(message, {
			delimiters: 'bump',
			data: data
		});
	}

	function commit(filepaths, message, addAll) {
		if(addAll){
			grunt.log.writeln('Adding any new files to repository tracking...');
			run('git add .');
			grunt.log.writeln('Committing with message: ' + message);
			run('git commit -m "' + message + '"');
		}else{
			grunt.log.writeln('Committing ' + filepaths.join(', ') + ' with message: ' + message);
			run('git commit -m "' + message + '" "' + filepaths.join('" "') + '"');
		}
	}

	function push() {
		grunt.log.writeln('Pushing changes to remote');
		run('git push');
	}

	function deployBranch(name, deploySLCPMServerURL) {
		grunt.log.writeln('Checking out new branch ' + name);
		run('git checkout -b ' + name);
		grunt.log.writeln('Building loopback app onto branch and committing ' + name);
		run('slc build --onto '+name+' --install --commit');
		grunt.log.writeln('Pushing branch to remote repository');
		run('git push origin '+name);
		grunt.log.writeln('Deploying branch to SLC PM Server at: ' + deploySLCPMServerURL);
		run('slc deploy '+deploySLCPMServerURL+' '+name);
		grunt.log.writeln('Returning to master branch...');
		run('git checkout -f master');
	}

	function run(cmd) {
		if (grunt.option('no-write')) {
			grunt.verbose.writeln('Not actually running: ' + cmd);
		} else {
			grunt.verbose.writeln('Running: ' + cmd);
			var result = shell.exec(cmd, {silent:true});
			if (result.code !== 0) {
				grunt.log.error('Error (' + result.code + ') ' + result.output);
			}
		}
	}

};