
describe.only("report", () => {

  describe("call report api", done => {

    it("success", async(done) => {
      try {
        let data = {
          cpuBenchmark: '48255.59',
          networkInfo: {
            ping: '47',
            upload: '1861818.18',
            download: '81269.84',
          },
          cpu: 'Intel(R) Core(TM) i5-5250U CPU @ 1.60GHz',
          model: 'MacBookAir7,2',
          systemVersion: 'OS X El Capitan 10.11.3',
          ram: [
            {
              size: '4 GB',
              speed: '1600 MHz',
              status: 'OK',
              type: 'DDR3',
            }, {
              size: '4 GB',
              speed: '1600 MHz',
              status: 'OK',
              type: 'DDR3',
            },
          ],
          network: [
            {
              device: 'en0',
              ethernetAddress: 'e0:ac:cb:9b:75:d2',
              hardware: 'Wi-Fi',
            }, {
              device: 'en1',
              ethernetAddress: '9a:00:03:f4:55:80',
              hardware: 'Thunderbolt 1',
            }, {
              device: 'en2',
              ethernetAddress: 'e0:ac:cb:9b:75:d3',
              hardware: 'Bluetooth PAN',
            }, {
              device: 'bridge0',
              ethernetAddress: 'e2:ac:cb:b9:85:00',
              hardware: 'Thunderbolt Bridge',
            },
          ],
          software: {
            chrome: '51.0.2704.84',
            flash: '21.0.0.226',
            safari: '9.0.3',
          },
          traceRoute: [
            '172.217.25.99 : 211.72.239.254 (ttl=1 ms=6)',
            '172.217.25.99 : 168.95.229.166 (ttl=2 ms=4)',
            '172.217.25.99 : 220.128.16.234 (ttl=3 ms=7)',
            '172.217.25.99 : 220.128.16.29 (ttl=4 ms=8)',
            '172.217.25.99 : 220.128.18.193 (ttl=5 ms=6)',
            '172.217.25.99 : 72.14.205.150 (ttl=6 ms=10)',
            '172.217.25.99 : 216.239.62.178 (ttl=7 ms=50)',
            '172.217.25.99 : 209.85.242.163 (ttl=8 ms=12)',
            '172.217.25.99 : 216.239.41.152 (ttl=9 ms=45)',
            '172.217.25.99 : 209.85.243.238 (ttl=10 ms=46)',
            '172.217.25.99 : 209.85.253.163 (ttl=11 ms=46)',
            '172.217.25.99 : 108.170.233.83 (ttl=12 ms=49)',
            '172.217.25.99 : 172.217.25.99 (ttl=13 ms=46)',
          ],
        };
        const result = await request.post("/report").send(data);
        result.status.should.be.equal(200);
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
