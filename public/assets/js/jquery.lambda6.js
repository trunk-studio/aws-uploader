(function ( $ ) {
    
    $.lambda6 = function( options ) {
        
        var settings = $.extend({
            operation: 'echo',
            payload: {},
            callbacks: {}
        }, options );
        
        return $.ajax({
            url: '/login/lambda.ashx?op=' + settings.operation,
            method: 'POST',
            data: settings.payload,
            dataType: 'json'
        });
    };

}( jQuery ));