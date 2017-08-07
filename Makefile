run: dist/static/js/script.js
	@node dist/static/js/script*.js

dist/static/js/script.js: src/js/index.js
	@make clean
	./node_modules/.bin/broccoli build dist

clean:
	@rm -rf dist || true

serve:
	./node_modules/.bin/broccoli serve

# test:
# 	./node_modules/.bin/mocha --compilers js:babel-core/register

# .PHONY: test
