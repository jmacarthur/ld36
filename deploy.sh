TARGET_DIR=$1
set +e
cp *.html $TARGET_DIR
cp *.css $TARGET_DIR
cp *.js $TARGET_DIR
cp -r sound $TARGET_DIR
cp -r graphics $TARGET_DIR
mkdir $TARGET_DIR/box2djs
cp box2djs/box2d.js $TARGET_DIR/box2djs
cp -r box2djs/lib $TARGET_DIR/box2djs
