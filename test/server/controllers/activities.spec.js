describe("coupon", () => {

    describe("use", done => {
        before(async done => {
            try {

                done();
            } catch (e) {
                done(e);
            }
        })

        it('should get agritour`s activities from server', async done => {
            try {
                let target = 'agritour';
                let result = await request.get("/rest/activities/" + target);

                // data json
                // {
                //     result: true,
                //     errMsg: '',
                //     target: "agritour",
                //     rss: "http://xxx.xxxx.xxx",
                //     list: [{
                //         title: "",
                //         time: null,
                //         url: "",
                //         description: ""
                //     }],
                // }

                result.result.should.be.eq(true);
                result.name.should.be.eq('activities');
                result.app.should.be.eq('agritour');
                result.rss.should.be.contains('http');
                result.list.should.be.array;
                result.list[0].title.should.be.string;
                done();
            } catch (e) {
                done(e);
            }
        });

    });
});
