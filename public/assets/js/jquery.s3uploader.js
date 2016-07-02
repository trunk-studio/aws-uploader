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
            signatureEndpoint: '/lambda/signature',
            transcoderCallbackEndpoint: '',
            uploaderParams: {},
            callbacks: {}
        }, options );
        
        var target = $(this);
        var uploaderParams = settings.uploaderParams;

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
        
                    var isVideo = (uploaderParams.filetype == 'video');
                    var filename = uploader.getName(fileId);
                    var uuid = uploader.getUuid(fileId);
                    var uuid2 = generateUUID();
                    var ext = filename.substr(filename.lastIndexOf('.') + 1);
                    
                    uploaderParams.fileKeyId = uuid;
                    
                    uploaderParams.objectId = uuid2.split('-').pop().substring(0, 10);
                    
                    if (isVideo) {
                        uploaderParams.objectId += ("_" + uploaderParams.lang);
                    }
                    
                    var typePrefix = uploaderParams.filetype.substring(0, 1);
                    
                    var custmerIdPrefix = String.fromCharCode(97+uploaderParams.custmerId%26);
                    
                    return isVideo ?
                        'emvpupload/' + custmerIdPrefix + uploaderParams.custmerId + '/' + typePrefix + '/' +  uploaderParams.fileKeyId + '/' + uploaderParams.lang + '/raw.' + ext
                        :
                        'emvpcontent/' + custmerIdPrefix + uploaderParams.custmerId + '/' + typePrefix + '/' +  uploaderParams.fileKeyId + '.' + ext;
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

                    var callbackParams = {
                        fileKeyId: uploaderParams.fileKeyId,
                        objectId: uploaderParams.objectId,
                        createdAt: new Date(),
                        fileName: name,
                        fileSize: uploader.getSize(id),
                        isConverted: false
                    };
                    
                    if (uploaderParams.filetype != 'video') {
                        var ext = name.substr(name.lastIndexOf('.') + 1);
                        var typePrefix = uploaderParams.filetype.substring(0, 1);
                        var custmerIdPrefix = String.fromCharCode(97+uploaderParams.custmerId%26);

                        callbackParams.rowExt = ext;
                        callbackParams.url = 'https://' + uploaderParams.cdnUrl + '/emvpcontent/' +
                            custmerIdPrefix + uploaderParams.custmerId + '/' + typePrefix + '/' +  uploaderParams.fileKeyId + '.' + ext;
                    }

                    if (responseJSON.success) {

                        if (settings.callbacks.onUploadSuccess) {
                            settings.callbacks.onUploadSuccess(uploader, uploaderParams, callbackParams, responseJSON);
                        }

                        if (uploaderParams.filetype == 'video') {
                            var outputs = [];
    
                            for (var i = 0; i < uploaderParams.outputs.length; i++) {
                                var output = uploaderParams.outputs[i];
    
                                outputs.push({
                                    Key: output.resolutionKind + '/' + uploaderParams.lang + '/' + uploaderParams.objectId + '.mp4',
                                    PresetId: output.presetId,
                                    ThumbnailPattern: output.resolutionKind + '/' + uploaderParams.lang + '/' + uploaderParams.objectId + '-{count}'
                                });
                            }
                            
                            var custmerIdPrefix = String.fromCharCode(97+uploaderParams.custmerId%26);
                            
                            var outputKeyPrefix = 'emvpcontent/' + custmerIdPrefix + uploaderParams.custmerId + '/v/' + uploaderParams.fileKeyId + '/';
    
                            var cloudfrontBaseUrl = 'https://' + uploaderParams.cdnUrl + '/' + outputKeyPrefix;
    
                            var videoUrl480 = cloudfrontBaseUrl + '480/' + uploaderParams.lang + '/' + uploaderParams.objectId + '.mp4';
                            var videoUrl720 = cloudfrontBaseUrl + '720/' + uploaderParams.lang + '/' + uploaderParams.objectId + '.mp4';
                            
                            var callbackParamsString = window.btoa(JSON.stringify({
                                fileKeyId: uploaderParams.fileKeyId,
                                objectId: uploaderParams.objectId,
                                isConverted: true,
                                videoUrl480: videoUrl480,
                                thumbnail480: '',
                                videoSize480: 0,
                                videoUrl720: videoUrl720,
                                thumbnail720: '',
                                videoSize720: 0,
                                videoDuration: 0,
                                lang: uploaderParams.lang
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
                                        CallbackParams0: callbackParamsString.substr(0, 256),
                                        CallbackParams1: callbackParamsString.substr(256, 256),
                                        CallbackParams2: callbackParamsString.substr(512, 256),
                                        CallbackParams3: callbackParamsString.substr(768, 256)
                                    },
                                    PipelineId: uploaderParams.pipelineId,
                                }
                            })
                            .done(function(data) {
                                //alert('開始轉檔');
                                
                                if (settings.callbacks.onTranscoderBegin) {
                                    settings.callbacks.onTranscoderBegin(uploader, uploaderParams, callbackParams, responseJSON);
                                }
                            });
                        }
                    }
                    else {
                        //alert(responseJSON.error);
                        
                        if (settings.callbacks.onUploadError) {
                            settings.callbacks.onUploadError(uploader, uploaderParams, callbackParams, responseJSON);
                        }
                    }
                }
            }
        });
        
        this._uploader = uploader;
        
        return this;
    };
    
}( jQuery ));
