(function ( $ ) {

    var generateUUID = function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    $.fn.s3uploader = function( options ) {

        var settings = $.extend({
            debug: false,
            accessKey: '----',
            requestEndpoint: 'emvpdev.s3.amazonaws.com',
            signatureEndpoint: '/login/lambda.ashx?op=signature',
            transcoderCallbackEndpoint: '',
            uploaderParams: {},
            callbacks: {}
        }, options );
        
        var target = $(this);
        var uploaderParams = settings.uploaderParams;
        
        var __uploaderParamsCache = {};

        var uploader = new qq.s3.FineUploader({
            debug: settings.debug,
            element: target.get(0),
            request: {
                endpoint: settings.requestEndpoint,
                accessKey: settings.accessKey
            },
            signature: {
                endpoint: settings.signatureEndpoint
            },
            objectProperties: {
                key: function(fileId) {
                    
                    console.log('Invoke objectProperties.key, fileId = ' + fileId);
                    
                    var _uploaderParams = __uploaderParamsCache[fileId] = jQuery.extend(true, {}, uploaderParams);

                    var isVideo = (_uploaderParams.filetype == 'video');
                    var filename = uploader.getName(fileId);
                    var uuid = uploader.getUuid(fileId);
                    var uuid2 = generateUUID();
                    var ext = filename.substr(filename.lastIndexOf('.') + 1);
                    
                    _uploaderParams.fileKeyId = uuid;
                    
                    _uploaderParams.objectId = uuid.split('-').pop().substring(0, 10);
                    
                    if (isVideo && _uploaderParams.lang) {
                        // lang not null
                        _uploaderParams.objectId += ("_" + _uploaderParams.lang);
                    }
                    
                    var typePrefix = _uploaderParams.filetype.substring(0, 1);
                    
                    var custmerIdPrefix = String.fromCharCode(97+_uploaderParams.custmerId%26);
                    
                    if (isVideo) {
                        if (_uploaderParams.lang) {
                            return 'emvpupload/' + custmerIdPrefix + _uploaderParams.custmerId + '/' + typePrefix + '/' +  _uploaderParams.fileKeyId + '/' + _uploaderParams.lang + '/raw.' + ext;
                        }
                        else {
                            return 'emvpupload/' + custmerIdPrefix + _uploaderParams.custmerId + '/' + typePrefix + '/' +  _uploaderParams.fileKeyId + '/raw.' + ext;                            
                        }
                    }
                    else {
                        return 'emvpcontent/' + custmerIdPrefix + _uploaderParams.custmerId + '/' + typePrefix + '/' +  _uploaderParams.fileKeyId + '.' + ext;
                    }
                },
                acl: "public-read"
            },
            retry: {
                enableAuto: true,
                autoAttemptDelay: uploaderParams.resumeInterval,
                maxAutoAttempts: uploaderParams.resumeTime
            },
            resume: {
                enabled: true
            },
            chunking: {
                enabled: true
            },
            multiple: uploaderParams.amountAllow > 1,
            validation: {
                allowedExtensions: uploaderParams.extAllow.split(','),
                sizeLimit: uploaderParams.sizeLimit
            },
            callbacks: {
                onUpload: function(id, name) {
                    // on progress
                },
                onComplete: function(id, name, responseJSON, xhr) {
                    
                    console.log('Invoke onComplete, id = ' + id);
                    
                    var _uploaderParams = __uploaderParamsCache[id];

                    var callbackParams = {
                        fileKeyId: _uploaderParams.fileKeyId,
                        objectId: _uploaderParams.objectId,
                        createdAt: new Date(),
                        fileName: name,
                        fileSize: uploader.getSize(id),
                        isConverted: false
                    };
                    
                    if (_uploaderParams.filetype != 'video') {
                        var ext = name.substr(name.lastIndexOf('.') + 1);
                        var typePrefix = _uploaderParams.filetype.substring(0, 1);
                        var custmerIdPrefix = String.fromCharCode(97+_uploaderParams.custmerId%26);

                        callbackParams.rowExt = ext;
                        callbackParams.url = 'https://' + _uploaderParams.cdnUrl + '/emvpcontent/' +
                            custmerIdPrefix + _uploaderParams.custmerId + '/' + typePrefix + '/' +  _uploaderParams.fileKeyId + '.' + ext;
                    }

                    if (responseJSON.success) {

                        if (settings.callbacks.onUploadSuccess) {
                            settings.callbacks.onUploadSuccess(uploader, _uploaderParams, callbackParams, responseJSON);
                        }

                        if (_uploaderParams.filetype == 'video') {
                            var outputs = [];
    
                            for (var i = 0; i < _uploaderParams.outputs.length; i++) {
                                var output = _uploaderParams.outputs[i];
                                
                                let folder = output.resolutionKind + '/';
                                
                                if (_uploaderParams.lang) {
                                    folder += (_uploaderParams.lang + '/');
                                }
                                
                                let baseName = _uploaderParams.objectId;
                                
                                outputs.push({
                                    Key:  folder + baseName + '.mp4',
                                    PresetId: output.presetId,
                                    ThumbnailPattern: folder + baseName + '-{count}'
                                });
                            }
                            
                            var custmerIdPrefix = String.fromCharCode(97+_uploaderParams.custmerId%26);
                            
                            var outputKeyPrefix = 'emvpcontent/' + custmerIdPrefix + _uploaderParams.custmerId + '/v/' + _uploaderParams.fileKeyId + '/';
    
                            var cloudfrontBaseUrl = 'https://' + _uploaderParams.cdnUrl + '/'; // + outputKeyPrefix;
    
                            //var videoUrl480 = cloudfrontBaseUrl + '480/' + _uploaderParams.lang + '/' + _uploaderParams.objectId + '.mp4';
                            //var videoUrl720 = cloudfrontBaseUrl + '720/' + _uploaderParams.lang + '/' + _uploaderParams.objectId + '.mp4';
                            
                            
                            var videoKeyPattern = outputKeyPrefix + '{resolutionKind}/';
                            
                            if (_uploaderParams.lang) {
                                videoKeyPattern += (_uploaderParams.lang + '/');
                            }
                            
                            videoKeyPattern += (_uploaderParams.objectId + '.mp4');
                            
                            var callbackParamsString = window.btoa(JSON.stringify({
                                fileKeyId: _uploaderParams.fileKeyId,
                                objectId: _uploaderParams.objectId,
                                isConverted: true,
                                /* videoUrl480: videoUrl480,
                                thumbnail480: '',
                                videoSize480: 0,
                                videoUrl720: videoUrl720,
                                thumbnail720: '',
                                videoSize720: 0, */
                                outputs: [],
                                videoDuration: 0,
                                lang: _uploaderParams.lang
                            }));
                            
                            $.lambda6({
                                operation: 'transcoder',
                                payload: {
                                    Input: {
                                        Key: uploader.getKey(id)
                                    },
                                    OutputKeyPrefix: outputKeyPrefix,
                                    Outputs: outputs,
                                    UserMetadata: {
                                        CallbackEndpoint: settings.transcoderCallbackEndpoint,
                                        CloudFrontBaseURL: window.btoa(cloudfrontBaseUrl),
                                        VideoKeyPattern: window.btoa(videoKeyPattern),
                                        CallbackParams0: callbackParamsString.substr(0, 256),
                                        CallbackParams1: callbackParamsString.substr(256, 256),
                                        CallbackParams2: callbackParamsString.substr(512, 256),
                                        CallbackParams3: callbackParamsString.substr(768, 256)
                                    },
                                    PipelineId: _uploaderParams.pipelineId,
                                }
                            })
                            .done(function(data) {
                                //alert('開始轉檔');
                                
                                if (settings.callbacks.onTranscoderBegin) {
                                    settings.callbacks.onTranscoderBegin(uploader, _uploaderParams, callbackParams, responseJSON);
                                }
                            });
                        }
                    }
                    else {
                        //alert(responseJSON.error);
                        
                        if (settings.callbacks.onUploadError) {
                            settings.callbacks.onUploadError(uploader, _uploaderParams, callbackParams, responseJSON);
                        }
                    }
                }
            }
        });
        
        this._uploader = uploader;
        
        return this;
    };
    
}( jQuery ));
