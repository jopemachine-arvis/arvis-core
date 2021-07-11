import _ from 'lodash';
import parseJson from 'parse-json';
import { xml2json } from 'xml-js';

export const xmlToJsonScriptFilterItemFormat = (stdout: string, stderr?: string) => {
  try {
    let target = parseJson(
      xml2json(stdout, { compact: true, ignoreDeclaration: true })
    );

    if (target.output) target = target.output;

    return {
      items: target.items.item
        ? target.items.item.length
          ? target.items.item.map(xmlScriptFilterItemToJsonScriptFilterItem)
          : [xmlScriptFilterItemToJsonScriptFilterItem(target.items.item)]
        : [],
      variables: target.variables ? xmlExtractGlobalVars(target.variables) : {},
      rerun: target.rerun ? target.rerun : undefined,
    };
  } catch (err) {
    throw new Error(
      `XML Scriptfilter format error!\n${err}\n\nstdout: ${stdout}\n\nstderr: ${stderr}\n`
    );
  }
};

/**
 * @param  {any} variables
 * @summary Extract variables from xml format's ScriptFilterItem
 */
export const xmlExtractGlobalVars = (variables: any) => {
  return _.reduce(
    variables.variable.map((variable) => {
      return {
        [variable._attributes.name]: variable._text,
      };
    }),
    (prev, curr) => {
      curr[Object.keys(prev)[0]] = Object.values(prev)[0];
      return curr;
    },
    {}
  );
};

/**
 * @param  {any} xmlScriptFilterItem
 * @summary Convert xml format's ScriptFilterItem to json format's ScriptFilterItem
 */
export const xmlScriptFilterItemToJsonScriptFilterItem = (
  xmlScriptFilterItem: any
) => {
  const extractValue = (obj: Record<string, any> | undefined, key: string) => {
    if (obj) return obj[key];
    return undefined;
  };

  const eachItem = {};
  // Try to find on Attributes first, Try to find on Elements next
  eachItem['arg'] =
    extractValue(xmlScriptFilterItem._attributes, 'arg') ??
    extractValue(xmlScriptFilterItem.arg, '_text');
  eachItem['subtitle'] =
    extractValue(xmlScriptFilterItem._attributes, 'subtitle') ??
    extractValue(xmlScriptFilterItem.subtitle, '_text');
  eachItem['title'] =
    extractValue(xmlScriptFilterItem._attributes, 'title') ??
    extractValue(xmlScriptFilterItem.title, '_text');
  eachItem['valid'] =
    extractValue(xmlScriptFilterItem._attributes, 'valid') ??
    extractValue(xmlScriptFilterItem.valid, '_text');
  eachItem['autocomplete'] =
    extractValue(xmlScriptFilterItem._attributes, 'autocomplete') ??
    extractValue(xmlScriptFilterItem.autocomplete, '_text');
  eachItem['quicklookurl'] =
    extractValue(xmlScriptFilterItem._attributes, 'quicklookurl') ??
    extractValue(xmlScriptFilterItem.quicklookurl, '_text');

  eachItem['type'] = extractValue(xmlScriptFilterItem._attributes, 'type');
  eachItem['uid'] = extractValue(xmlScriptFilterItem._attributes, 'uid');

  eachItem['icon'] = {
    path:
      extractValue(
        xmlScriptFilterItem.icon
          ? xmlScriptFilterItem.icon._attributes
          : undefined,
        'icon'
      ) ?? extractValue(xmlScriptFilterItem.icon, '_text'),
  };

  // To do :: Add below elements here
  eachItem['mod'] = {};
  eachItem['text'] = {
    copy: extractValue(xmlScriptFilterItem.text, '_text'),
    largetype: '',
  };

  return eachItem;
};
