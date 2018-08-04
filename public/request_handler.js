import chrome from 'ui/chrome';
import { dashboardContextProvider } from 'plugins/kibana/dashboard/dashboard_context'
import { singleQueryBackwardCapability } from './backward_capability';

const Mustache = require('mustache');

export const createRequestHandler = function (Private, es, indexPatterns, $sanitize, timefilter) {

  const myRequestHandler = (vis, appState, uiState, searchSource) => {

    const dashboardContext = Private(dashboardContextProvider);
    const options = chrome.getInjected('transformVisOptions');

    function display_error(message) {
      return ({ html: `<div style="text-align: center;"><i>${message}</i></div>` });
    }

    return singleQueryBackwardCapability(indexPatterns, vis, false)
      .then(function () {
        if (!vis.params.multiquerydsl) {
          return display_error('Multy Query DSL is empty');
        }

        const context = dashboardContext();

        let multiquerydsl = {};
        try {
          let multiquerydsltext = vis.params.multiquerydsl;
          multiquerydsltext = multiquerydsltext.replace(/"_DASHBOARD_CONTEXT_"/g, JSON.stringify(context));
          multiquerydsltext = multiquerydsltext.replace(/"_TIME_RANGE_\[([^\]]*)\]"/g, `{"range":{"$1":{"gte": "${timefilter.time.from}", "lte": "${timefilter.time.to}"}}}`);
          multiquerydsl = JSON.parse(multiquerydsltext);
        } catch (error) {
          console.log("MultiqueryDSL Parse Error", error);
          return display_error('Error (See Console)');
        }

        const bindme = {};
        bindme.context = context;
        bindme.response = {};

        return Promise.all(Object.keys(multiquerydsl).map(
          function (query_name) {
            const body = multiquerydsl[query_name];
            const index = body['index'];
            delete body['index'];
            return es.search({
              index: index,
              body: body,
            }).then(function (response) {
              if (query_name === '_single_') {
                bindme.response = Object.assign(bindme.response, response);
              } else {
                bindme.response = Object.assign(bindme.response, { [query_name]: response });
              }
            });
          },
        ))
          .then(function () {
            if (options.allow_unsafe) {
              try {
                const response = bindme.response;
                bindme.meta = eval(vis.params.meta);
              } catch (jserr) {
                bindme.jserr = jserr;
                console.log("Javascript Compilation Error", jserr);
                return display_error('Error (See Console)');
              }
            }
            const formula = vis.params.formula;
            try {
              return ({ html: Mustache.render(formula, bindme) });
            } catch (error) {
              console.log("Mustache Template Error", error);
              return display_error('Error (See Console)');
            }
          })
          .catch(function (error) {
            console.log("Elasticsearch Query Error", error);
            return display_error('Error (See Console)');
          })
      });

  };

  return myRequestHandler;

};