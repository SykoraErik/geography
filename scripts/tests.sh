#!/bin/bash
# test script for .travis.yml

git clone https://github.com/SykoraErik/BachelorThesis.git testRepository
cd testRepository
mvn -Pphantomjs -Dbase.url=http://staging-new.slepemapy.cz/ clean verify