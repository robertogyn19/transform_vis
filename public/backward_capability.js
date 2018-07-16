// Single queryDSL backward capability - transform options from previous format
function singleQueryBackwardCapability(indexPatterns, vis, reload = false) {
  if (vis.params.indexpattern && !vis.params.multiquerydsl) {
    return indexPatterns.get(vis.params.indexpattern).then(function (indexPattern) {
      if (!reload && $('[data-test-subj="visualizeEditorRenderButton"]').length > 0) {
        return;
      }
      let querydsltext = vis.params.querydsl;
      if (indexPattern.timeFieldName) {
        querydsltext = querydsltext.replace(/"_DASHBOARD_CONTEXT_"/g, `"_DASHBOARD_CONTEXT_","_TIME_RANGE_[${indexPattern.timeFieldName}]"`)
      }
      const querydsl = JSON.parse(querydsltext);
      vis.params.multiquerydsl = JSON.stringify({
        "_single_":
          Object.assign(
            {
              "index": indexPattern.title,
            },
            querydsl,
          ),
      }, null, '  ');
      if (reload) {
        setTimeout(() => $('[data-test-subj="visualizeEditorRenderButton"]').click(), 0);
      }
    });
  } else {
    return Promise.resolve();
  }
}

export { singleQueryBackwardCapability };