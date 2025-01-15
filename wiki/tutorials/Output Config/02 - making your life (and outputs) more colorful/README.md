# Tutorials / Output Config: 02 - making your life (and outputs) more colorful

If you want to play with the `display errors` setting: \
Change the `value` key in `cfg` or `prompt` to anything else, like `not_value`:

```json
   "not_value": "beautiful scenery nature glass bottle landscape, purple galaxy bottle,",
```

This will raise an error: depending on the settings in `error display`, it will be:

- displayed in a popup,
- displayed in your browser console (F12 in Firefox and probably others),
- ignored
