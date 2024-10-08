const $loading = document.body.querySelector(':scope > .loading');

const showLoading = () => $loading.classList.add('--visible');
const hideLoading = () => $loading.classList.remove('--visible');

const loadTickers = () => {
    const $tickerContainer = document.querySelector('.ticker-container');
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
            return
        }
        hideLoading()
        if (xhr.status < 200 || xhr.status >= 300) {
            //TODO 실패 처리 로직 작성
            return;
        }
        const response = JSON.parse(xhr.responseText);
        if (response['response']['header']['resultCode'] !== '00') {
            //TODO 응답 실패 처리 로직 작성
            return;
        }
        for (const tickerObject of response['response']['body']['items']['item']) {
            // "basDt": "20241004",
            //     "srtnCd": "A000020",
            //     "isinCd": "KR7000020008",
            //     "mrktCtg": "KOSPI",
            //     "itmsNm": "동화약품",
            //     "crno": "1101110043870",
            //     "corpNm": "동화약품(주)"
            const $name = document.createElement('span');
            $name.classList.add('name');
            $name.innerText = tickerObject['itmsNm']

            const $spring = document.createElement('span');
            $spring.classList.add('spring');

            const $market = document.createElement('span');
            $market.classList.add('market');
            $market.innerText = tickerObject['mrktCtg'];

            const $code = document.createElement('span');
            $code.classList.add('code');
            $code.innerText = tickerObject['srtnCd'];

            const $ticker = document.createElement('li');
            $ticker.classList.add('ticker');
            $ticker.append($name, $spring, $market, $code);
            $ticker.dataset.code = tickerObject['srtnCd'];
            $ticker.addEventListener('click', () => {
                loadData($ticker.dataset.code.replace('A', ''));
            });
            $tickerContainer.append($ticker);
        }
    };
    xhr.open('GET', 'https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo?serviceKey=TY1m3C7Zmue3pMidAj2I3ChmDFDuNZRw0wy%2Br7xtISS3C8XT22vM1Y1F%2F6YoscmR2sZAVneIrEnOrfQs5UHKWQ%3D%3D&resultType=json&numOfRows=1000');
    xhr.send();
    $tickerContainer.innerHTML = '';
    showLoading()
};
//테이블
const loadData = (code) => {
    const $table = document.body.querySelector(':scope > .table-wrapper > .table');
    const $tbody = $table.querySelector(':scope > tbody');
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
            return;
        }
        hideLoading();
        if (xhr.status < 200 || xhr.status >= 300) {
            //TODO 실패 처리 로직 작성
            return;
        }
        const response = JSON.parse(xhr.responseText);
        if (response['response']['header']['resultCode'] !== '00') {
            //TODO 올바르지 않은 응답 실패 처리 로직 작성
            return;
        }
        for (const dataObject of response['response']['body']['items']['item']) {
            const $dateTh = document.createElement('th');
            $dateTh.innerText = `${dataObject['basDt'].substring(0, 4)}-${dataObject['basDt'].substring(4, 6)}-${dataObject['basDt'].substring(6, 8)}`;
            const $openTd = document.createElement('td');
            $openTd.innerText = parseInt(dataObject['mkp']).toLocaleString();
            const $highTd = document.createElement('td');
            $highTd.innerText = parseInt(dataObject['hipr']).toLocaleString();
            const $lowTd = document.createElement('td');
            $lowTd.innerText = parseInt(dataObject['lopr']).toLocaleString();
            const $closeTd = document.createElement('td');
            $closeTd.innerText = parseInt(dataObject['clpr']).toLocaleString();
            const change = parseInt(dataObject['vs']);
            const $changeTd = document.createElement('td');
            $changeTd.innerText = (change > 0 ? '+' : '') + change.toLocaleString();
            $changeTd.classList.add('change');
            const changePct = parseFloat(dataObject['fltRt']);
            const $changePctTd = document.createElement('td');
            $changePctTd.innerText = (changePct > 0 ? '+' : '') + changePct + '%';
            $changePctTd.classList.add('change');
            const $volumeTd = document.createElement('td');
            $volumeTd.innerText = parseInt(dataObject['trqu']).toLocaleString();
            const $tradeCapTd = document.createElement('td');
            $tradeCapTd.innerText = parseInt(dataObject['trPrc']).toLocaleString();
            const $tr = document.createElement('tr');
            $tr.append($dateTh, $openTd, $highTd, $lowTd, $closeTd, $changeTd, $changePctTd, $volumeTd, $tradeCapTd);
            if (change > 0) {
                $tr.classList.add('up');
            } else if (change < 0) {
                $tr.classList.add('down');
            }
            $tbody.append($tr);

        }
        //차트
        const ohlcData = []; //주가 정보 (시, 고, 저, 종가)를 담을 배열
        const volumeData = []; //거래량을 담을 배열
        response['response']['body']['items']['item'].reverse().forEach((x) => {
            const year = parseInt(x['basDt'].substring(0, 4));
            const month = parseInt(x['basDt'].substring(4, 6)) - 1; //js의 data객체가 가지는 월은 0~11이므로 1을 빼준다.
            const day = parseInt(x['basDt'].substring(6, 8));
            const timestamp = new Date(year, month, day);
            const open = parseInt(x['mkp']);
            const high = parseInt(x['hipr']);
            const low = parseInt(x['lopr']);
            const close = parseInt(x['clpr']);
            const volume = parseInt(x['trqu']);
            ohlcData.push({
                x: timestamp.getTime(),
                y: [open, high, low, close],
            })
            volumeData.push({
                x: timestamp.getTime(),
                y: volume,
            });
        });
        const ohlcChartOption = {
            series: [{
                data: ohlcData,
            }],
            chart: {
                type: 'candlestick',
                height: '100%',
                id: 'ohlc',
                toolbar: {
                    autoSelected: 'pan',
                    show: true,
                },
                zoom: {
                    enabled: false
                },
            },
            xaxis: {
                type: 'datetime',
                axisBorder: {color: '$424242'},
                labels: {style: {colors: '#ffffff'}}

            },
            yaxis: {opposite: true},
            grid: {borderColor: '#424242'},
            labels: {
                style: {colors: '#ffffff'},
            }
        };
        const volumeChartOption = {
            series: [{
                data: volumeData,
            }],
            chart: {
                height: 160,
                type: 'bar',
                brush: {
                    enabled: true,
                    target: 'ohlc'
                },
                selection: {
                    enabled: true,
                    xaxis: {
                        min: (new Date()).getTime() - (24 * 60 * 60 * 1000) * 100,
                        //차트 초기 세팅시 x축 시작값을 100일전으로 설정하기 위한 값
                        max: (new Date()).getTime(),
                        //차트 초기 세팅시 x축 끝값을 오늘 날짜로 지정하기 위한 값
                    },
                    fill: {
                        color: '#bdbdbd',
                        opacity: 0.4,
                    },
                    stroke: {
                        color: '#3498db'
                    },
                },
            },
                dataLabels: {enabled: false},
                stroke: {width: 0},
                xaxis: {
                    type: 'datetime',
                    axisBorder: {color: '#424242'},
                },
                yaxis:
                    {
                        labels: {show: false},
                    },
                        grid: {show: false},
        };
        const $chartWrapper = document.body.querySelector(':scope > .chart-wrapper');
        const $ohlcChart = $chartWrapper.querySelector(':scope > .chart.ohlc');
        const $volumeChart = $chartWrapper.querySelector(':scope > .chart.volume');
        const ohlcChart = new ApexCharts($ohlcChart, ohlcChartOption);
        const volumeChart = new ApexCharts($volumeChart, volumeChartOption);
        ohlcChart.render();
        volumeChart.render()
    };
    xhr.open('GET', `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=TY1m3C7Zmue3pMidAj2I3ChmDFDuNZRw0wy%2Br7xtISS3C8XT22vM1Y1F%2F6YoscmR2sZAVneIrEnOrfQs5UHKWQ%3D%3D&resultType=json&numOfRows=1000&likeSrtnCd=${code}`)
    xhr.send();
    $tbody.innerHTML = '';
    showLoading();
}

loadTickers()