# Copyright (C) 2010-2015 GRNET S.A.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

import distribute_setup
distribute_setup.use_setuptools()

import os
import sys
import site

from setuptools import setup, find_packages
from fnmatch import fnmatchcase
from distutils.util import convert_path

HERE = os.path.abspath(os.path.normpath(os.path.dirname(__file__)))

from synnefo_ui.version import __version__

# Package info
VERSION = __version__
SHORT_DESCRIPTION = 'Synnefo UI component'

PACKAGES_ROOT = '.'

# Package meta
CLASSIFIERS = []

# Package requirements
INSTALL_REQUIRES = [
    'Django>=1.4, <1.5',
    'snf-django-lib',
    'snf-branding'
]

# Provided as an attribute, so you can append to these instead
# of replicating them:
standard_exclude = ["*.py", "*.pyc", "*$py.class", "*~", ".*", "*.bak", "node_modules"]
standard_exclude_directories = [
    ".*", "CVS", "_darcs", "./build", "./dist", "EGG-INFO", "*.egg-info", "snf-0.7", "node_modules"
]

# (c) 2005 Ian Bicking and contributors; written for Paste (http://pythonpaste.org)
# Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
# Note: you may want to copy this into your setup.py file verbatim, as
# you can't import this from another package, when you don't know if
# that package is installed yet.
def find_package_data(
    where=".",
    package="",
    exclude=standard_exclude,
    exclude_directories=standard_exclude_directories,
    only_in_packages=True,
    show_ignored=False):
    """
    Return a dictionary suitable for use in ``package_data``
    in a distutils ``setup.py`` file.

    The dictionary looks like::

        {"package": [files]}

    Where ``files`` is a list of all the files in that package that
    don"t match anything in ``exclude``.

    If ``only_in_packages`` is true, then top-level directories that
    are not packages won"t be included (but directories under packages
    will).

    Directories matching any pattern in ``exclude_directories`` will
    be ignored; by default directories with leading ``.``, ``CVS``,
    and ``_darcs`` will be ignored.

    If ``show_ignored`` is true, then all the files that aren"t
    included in package data are shown on stderr (for debugging
    purposes).

    Note patterns use wildcards, or can be exact paths (including
    leading ``./``), and all searching is case-insensitive.
    """
    out = {}
    stack = [(convert_path(where), "", package, only_in_packages)]
    while stack:
        where, prefix, package, only_in_packages = stack.pop(0)
        for name in os.listdir(where):
            fn = os.path.join(where, name)
            if os.path.isdir(fn):
                bad_name = False
                for pattern in exclude_directories:
                    if (fnmatchcase(name, pattern)
                        or fn.lower() == pattern.lower()):
                        bad_name = True
                        if show_ignored:
                            print >> sys.stderr, (
                                "Directory %s ignored by pattern %s"
                                % (fn, pattern))
                        break
                if bad_name:
                    continue
                if (os.path.isfile(os.path.join(fn, "__init__.py"))
                    and not prefix):
                    if not package:
                        new_package = name
                    else:
                        new_package = package + "." + name
                    stack.append((fn, "", new_package, False))
                else:
                    stack.append((fn, prefix + name + "/", package, only_in_packages))
            elif package or not only_in_packages:
                # is a file
                bad_name = False
                for pattern in exclude:
                    if (fnmatchcase(name, pattern)
                        or fn.lower() == pattern.lower()):
                        bad_name = True
                        if show_ignored:
                            print >> sys.stderr, (
                                "File %s ignored by pattern %s"
                                % (fn, pattern))
                        break
                if bad_name:
                    continue
                out.setdefault(package, []).append(prefix+name)
    return out



def build_ember_project():
    import subprocess as sp
    from distutils.spawn import find_executable as find
    project_dir = os.path.join(".", "snf-ui")
    if not os.path.exists(project_dir):
        os.mkdir(project_dir)
    setupdir = os.getcwd()
    os.chdir(project_dir)
    env = os.environ.get('SNFUI_AUTO_BUILD_ENV', 'production')
    cache_args = "--cache-min 99999999"

    if not find("npm"):
        raise Exception("NPM not found please install nodejs and npm")

    if not os.path.exists("./node_modules"):
        print "Install np[m dependencies"
        cmd = "npm install --silent " + cache_args
        ret = sp.call(cmd, shell=True)
        if ret == 1:
            raise Exception("ember install failed")

    ember_bin = "./node_modules/ember-cli/bin/ember"
    if not os.path.exists(ember_bin):
        print "Installing ember-cli..."
        cmd = "npm install ember-cli --silent " + cache_args
        sp.call(cmd, shell=True)

    bower_bin = "bower"
    if find("bower") is None:
        bower_bin = "./node_modules/bower/bin/bower"
        if not os.path.exists(bower_bin):
            print "Installing bower..."
            cmd = "npm install bower --silent " + cache_args
            sp.call(cmd, shell=True)

    if not os.path.exists("./bower_components"):
        print "Install bower dependencies"
        cmd = "%s install --allow-root --quiet" % bower_bin
        ret = sp.call(cmd, shell=True)
        if ret == 1:
            raise Exception("bower install failed")
    cmd = "%s build --environment %s --output-path %s" % \
        (ember_bin, env, "../synnefo_ui/static/snf-ui/")
    ret = sp.call(cmd, shell=True)
    if ret == 1:
        raise Exception("ember build failed")
    os.chdir(setupdir)


trigger_build = ["sdist", "build", "develop", "install"]
cmd = ''.join(sys.argv)
if any(x in cmd for x in trigger_build):
    if os.path.exists("./synnefo_ui/static/snf-ui"):
        print "Ember.js project already built in synnefo_ui/static/snf-ui"
    else:
        if os.environ.get('SNFUI_AUTO_BUILD', True) not in \
                ['False', 'false', '0']:
            build_ember_project()

PACKAGES = find_packages(PACKAGES_ROOT)
package_data = find_package_data('.')
setup(
    name='snf-ui-app',
    version=VERSION,
    license='GNU GPLv3',
    url='http://www.synnefo.org/',
    description=SHORT_DESCRIPTION,
    classifiers=CLASSIFIERS,

    author='Synnefo development team',
    author_email='synnefo-devel@googlegroups.com',
    maintainer='Synnefo development team',
    maintainer_email='synnefo-devel@googlegroups.com',

    packages=PACKAGES,
    package_dir={'': PACKAGES_ROOT},
    package_data=package_data,
    include_package_data=True,
    zip_safe=False,

    install_requires=INSTALL_REQUIRES,

    dependency_links=['http://www.synnefo.org/packages/pypi'],

    entry_points={
        'synnefo': [
            'web_apps = synnefo_ui.synnefo_settings:installed_apps',
            'web_static = synnefo_ui.synnefo_settings:static_files',
            'web_context_processors = synnefo_ui.synnefo_settings:synnefo_web_context_processors',
            'urls = synnefo_ui.urls:urlpatterns'
        ]
    },
)
