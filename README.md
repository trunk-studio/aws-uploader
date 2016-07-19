S3 File Uploader Demo for StrategicSale
========================================

Demo Site

http://emvpdev.trunksys.com/

## Server-side Implements

後端程式需要提供 `/lambda/$operation` 的 POST 存取，負責處理 Lambda Request 轉發。

* /lambda/echo
* /lambda/transcoder
* /lambda/signature

將收到的 POST 資料轉送至 AWS Lambda API Server。

Lambda API Server 參考範例（使用 curl 指令存取）

```
curl -H "Content-Type: application/json" -X POST -d "{\"operation\": \"echo\", \"payload\": \"Hello Lambda\"}" https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod
```

參考範例（Node.js + Koa）

```
    // appConfig.lambdaApiEndpoint = https://55z081wsq0.execute-api.ap-northeast-1.amazonaws.com/prod/s3upload-prod
    
    publicRoute.post('/lambda/:operation', async (ctx) => {
      try {
        let {operation} = ctx.params;
        let res = await fetch(appConfig.lambdaApiEndpoint, { method: 'POST', body: JSON.stringify({operation, payload: ctx.request.body })});
        ctx.body = await res.json();
      }
      catch (e) {
        ctx.body = { error: e };
      }
    });
```

Transcoder 影片轉檔作業完成後，會自動呼叫後端程式回寫資料庫。

Callback Endpoint 必須是完整的 URL（包含 http:// 或 https://），例如：

* http://網址/callback

備註：前端呼叫 `$.s3uploader` 時指定 `transcoderCallbackEndpoint` 設定此 Callback Endpoint URL 參數。

Callback 資料範例：

```
{
  fileKeyId: 'f35801c4-be27-4728-b433-a5c82e3288d6',
  objectId: '5195fd811f_en',
  isConverted: true,
  videoUrl480: 'https://dq8zej8azrytq.cloudfront.net/emvpcontent/a14057/v/f35801c4-be27-4728-b433-a5c82e3288d6/480/en/5195fd811f_en.mp4',
  thumbnail480: 'https://dq8zej8azrytq.cloudfront.net/emvpcontent/a14057/v/f35801c4-be27-4728-b433-a5c82e3288d6/480/en/5195fd811f_en-1.png',
  videoSize480: 12314135,
  videoUrl720: 'https://dq8zej8azrytq.cloudfront.net/emvpcontent/a14057/v/f35801c4-be27-4728-b433-a5c82e3288d6/720/en/5195fd811f_en.mp4',
  thumbnail720: 'https://dq8zej8azrytq.cloudfront.net/emvpcontent/a14057/v/f35801c4-be27-4728-b433-a5c82e3288d6/720/en/5195fd811f_en-1.png',
  videoSize720: 35425452,
  videoDuration: 282,
  lang: 'en'
}
```

## Front-end Implements

必要的 JavaScript / CSS Library：

* jQuery
* Fine Uploader

參考範例：

```
<!-- jQuery -->
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>

<!-- Fine Uploader -->
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/file-uploader/5.10.0/all.fine-uploader/fine-uploader-new.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/file-uploader/5.10.0/s3.jquery.fine-uploader/s3.jquery.fine-uploader.min.js"></script>
```

加入以下 JavaScript 函式庫：

* jquery.s3uploader.js
* jquery.lambda6.js

```
<script type="text/javascript" src="https://raw.githubusercontent.com/trunk-studio/aws-uploader-poc/master/public/assets/js/jquery.s3uploader.js"></script>
<script type="text/javascript" src="https://raw.githubusercontent.com/trunk-studio/aws-uploader-poc/master/public/assets/js/jquery.lambda6.js"></script>
```

在前端動態設定必要的 JS 參數。

```
var AWS_ACCESS_KEY_ID = 'AKIAJS4FV444UNYB5C4Q';
      
var uploaderParams = {
    custmerId: '14057',
    filetype: 'video',
    objectId: null,
    fileKeyId: null,
    extAllow: 'mpg,wmv,avi,mp4,mts,mov,m2p,dat,mkv,m4v,3gp,flv,mpeg,webm',
    amountAllow: 1,
    sizeLimit: 2147483648,
    lang: 'en',
    resumeTime: 5,
    resumeInterval: 10,
    cdnUrl: 'dq8zej8azrytq.cloudfront.net',
    pipelineId: '1462358425462-kxvzpj',
    outputs: [{
        presetId: '1465455390986-0t1jc6',
        resolutionKind: 480
    }, {
        presetId: '1465455363821-ymekw1',
        resolutionKind: 720
    }]
};
```

放置上傳檔案功能區塊（HTML)。

```
<div id="fine-uploader"></div>
```

呼叫 jQuery Plugins 函數 `$.s3uploader` 產生上傳功能。

```
$('#fine-uploader').s3uploader({
    debug: true,
    accessKey: AWS_ACCESS_KEY_ID,
    requestEndpoint: 'emvpdev.s3.amazonaws.com',
    signatureEndpoint: '/lambda/signature',
    transcoderCallbackEndpoint: 'http://emvpdev.trunksys.com:3001/callback',
    uploaderParams: uploaderParams,
    callbacks: {
        onUploadSuccess: function(uploader, uploaderParams, callbackParams, responseJSON) {
            $('#resultsContainer').text(JSON.stringify(callbackParams, null, 2));
            // TODO: 呼叫後端將 callbackParams 回寫資料庫
        },
        onUploadError: function(uploader, uploaderParams, callbackParams, responseJSON) {
            // TODO: 上傳檔案時發生錯誤
            alert("上傳失敗" + responseJSON.error);
        },
        onTranscoderBegin: function(uploader, uploaderParams, callbackParams, responseJSON) {
            // TODO: 已進入影片轉檔程序、允許離開上傳畫面
            alert('開始轉檔');
        }
    }
});
```