import { uiModules } from 'ui/modules';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
import { singleQueryBackwardCapability } from './backward_capability';
import chrome from 'ui/chrome';

const module = uiModules.get('kibana/transform_vis', ['kibana']);

module.controller('TransformVisEditorController', function ($scope, Private, indexPatterns) {
    
    const savedObjectsClient = Private(SavedObjectsClientProvider);
    $scope.options = chrome.getInjected('transformVisOptions');

    singleQueryBackwardCapability(indexPatterns, $scope.vis, true);

});