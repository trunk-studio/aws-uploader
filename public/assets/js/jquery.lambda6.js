$.lambda6 = function( options ) {
    
    var settings = $.extend({
        operation: 'echo',
        payload: {},
        callbacks: {}
    }, options );
    
    return $.ajax({
        url: '/lambda/' + settings.operation,
        method: 'POST',
        data: settings.payload,
        dataType: 'json'
    });
};