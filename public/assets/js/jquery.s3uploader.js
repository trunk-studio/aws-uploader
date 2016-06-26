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
        
                    var filename = uploader.getName(fileId);
                    var uuid = uploader.getUuid(fileId);
                    var uuid2 = generateUUID();
                    var ext = filename.substr(filename.lastIndexOf('.') + 1);
        
                    uploaderParams.fileKeyId = uuid;
                    uploaderParams.objectId = uuid2.split('-').pop().substring(0, 10) + "_" + uploaderParams.lang;

                    return 'emvpupload/a' + uploaderParams.custmerId + '/v/' +  uploaderParams.fileKeyId + '/' + uploaderParams.lang + '/raw.' + ext;
                }
            },
            retry: {
                enableAuto: true,
                autoAttemptDelay: uploaderParams.resumeInterval,
                maxAutoAttempts: uploaderParams.resumeTime
            },
            resume: {
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
                        isConverted: null,
                    };

                    if (responseJSON.success) {

                        if (settings.callbacks.onUploadSuccess) {
                            
                            settings.callbacks.onUploadSuccess(uploader, uploaderParams, callbackParams, responseJSON);
                            
                        }

                        var outputs = [];

                        for (var i = 0; i < uploaderParams.outputs.length; i++) {
                            var output = uploaderParams.outputs[i];

                            outputs.push({
                                Key: output.resolutionKind + '/' + uploaderParams.lang + '/' + uploaderParams.objectId + '.mp4',
                                PresetId: output.presetId,
                                ThumbnailPattern: output.resolutionKind + '/' + uploaderParams.lang + '/' + uploaderParams.objectId + '-{count}'
                            });
                        }

                        $.lambda6({
                            operation: 'transcoder',
                            payload: {
                                Input: {
                                    Key: uploader.getKey(id)
                                },
                                PipelineId: uploaderParams.pipelineId,
                                OutputKeyPrefix: 'emvpcontent/a' + uploaderParams.custmerId + '/v/' + uploaderParams.fileKeyId + '/',
                                Outputs: outputs
                            }
                        })
                        .done(function(data) {
                            //alert('開始轉檔');
                            
                            if (settings.callbacks.onTranscoderBegin) {
                                settings.callbacks.onTranscoderBegin(uploader, uploaderParams, callbackParams, responseJSON);
                            }
                        });
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
