//console.log(ccxt.exchanges)

const PROXY = 'https://cors-anywhere.herokuapp.com/'
const CURRENCY_SYMBOL = 'ETH/JPY'
const EXCHANGES = [
    'huobijp',
    'bitbank',
    'bitflyer',
    'liquid',
]

var best_bid = [0, 'NONE']
var best_ask = [999999, 'NONE']

const huobijp = new ccxt.huobijp({ enableRateLimit: true, 'proxy': PROXY })
const liquid = new ccxt.liquid({ enableRateLimit: true, 'proxy': PROXY })
const bitbank = new ccxt.bitbank({ enableRateLimit: true, 'proxy': PROXY })

const market_body_elem = document.getElementById('market_body')
const asset_body_elem = document.getElementById('asset_body')
const market_search_elem = document.getElementById('market_search')
if (market_search_elem && market_body_elem) {
    market_search_elem.onkeyup = function() {
        let context = market_search_elem.value;
        let _children = market_body_elem.children;
        if (!context) {
            for (var i = 0; i < _children.length; i++) {
                _children[i].style.opacity = 1
            }
        } else {
            for (var i = 0; i < _children.length; i++) {
                let child = _children[i]
                if (!(child.innerHTML.includes(context) ||
                        child.innerHTML.toUpperCase().includes(context) ||
                        child.innerHTML.toLowerCase().includes(context))) {
                    _children[i].style.opacity = 0.5
                }
            }
        }
    }
}

EXCHANGES.forEach(e => {
    let tr = document.createElement('tr')
    let th = document.createElement('th')
    th.innerText = e.toUpperCase()

    let td_ask = document.createElement('td')
    td_ask.classList.add('ask')
    td_ask.id = `${e}-ask`
    td_ask.innerText = '00,000'
    let td_bid = document.createElement('td')
    td_bid.classList.add('bid')
    td_bid.id = `${e}-bid`
    td_bid.innerText = '00,000'

    tr.appendChild(th)
    tr.appendChild(td_ask)
    tr.appendChild(td_bid)

    market_body_elem.append(tr)

    let cloned_elem = tr.cloneNode(true)
    cloned_elem.children[1].id = ''
    cloned_elem.children[2].id = ''

    cloned_elem.children[1].classList.remove('ask')
    cloned_elem.children[1].classList.add('jpy')
    cloned_elem.children[2].classList.remove('bid')
    asset_body_elem.append(cloned_elem)
})

function arbitrage_refresh() {
    let no_available_analysis = (best_ask[1] === 'NONE' || best_bid[1] === 'NONE')
    let best_bid_elem = document.getElementById('best_bid_exchange')
    let best_ask_elem = document.getElementById('best_ask_exchange')
    if (best_ask_elem && best_bid_elem) {
        if (no_available_analysis) {
            best_ask_elem.innerText = '-'
            best_bid_elem.innerText = '-'
        } else {
            best_ask_elem.innerText = best_ask[1]
            best_bid_elem.innerText = best_bid[1]
        }
    }
    let spread = (best_bid[0] - best_ask[0])
    if (no_available_analysis) {
        spread = 0
    }
    let spread_elem = document.getElementById('spread')
    if (spread_elem) {
        spread_elem.innerText = spread
    }
    var order_amount = 0
    let order_amount_elem = document.getElementById('order_amount')
    if (order_amount_elem) {
        order_amount = order_amount_elem.value
    }
    let profit = (order_amount * spread)
    let profit_element = document.getElementById('profit')
    if (profit_element) {
        profit_element.innerText = profit
        if (profit !== 0) {
            if (profit < 0) {
                profit_element.className = 'less'
            } else {
                profit_element.className = 'profit'
            }
        }
    }
    if (!(best_bid[1] === 'NONE' || best_ask[1] === 'NONE') || true) {
        if (market_body_elem) {
            let children = market_body_elem.children
            for (var i = 0; i < children.length; i++) {
                let child = children[i]
                if (child) {
                    let header = child.children[0].innerText
                        //console.log(best_ask[1] + ' ' + best_bid[1] + ' ' + header)
                    if (header == best_ask[1]) {
                        child.children[1].style.border = '1px solid var(--color-ask)'
                    } else if (header == best_bid[1]) {
                        child.children[2].style.border = '1px solid var(--color-bid)'
                    } else {
                        child.children[1].style.border = '0'
                        child.children[2].style.border = '0'
                    }
                }
            }
        }
    }
}

async function get_and_set_last_order(symbol) {
    let ask_elem = document.getElementById(`${symbol}-ask`)
    let bid_elem = document.getElementById(`${symbol}-bid`)
    try {
        let order_book = eval(`${symbol}.fetchOrderBook('${CURRENCY_SYMBOL}')`)
        order_book.then(function(data) {
            ask_jpy = data.asks[0][0]
            bid_jpy = data.bids[0][0]
            if (ask_elem) {
                ask_elem.innerText = ask_jpy.toLocaleString()
            }
            if (bid_elem) {
                bid_elem.innerText = bid_jpy.toLocaleString()
            }

            if (best_bid[0] < bid_jpy) {
                best_bid[0] = bid_jpy
                best_bid[1] = symbol.toUpperCase()
            } else if (best_ask[0] > ask_jpy) {
                best_ask[0] = ask_jpy
                best_ask[1] = symbol.toUpperCase()
            }
            arbitrage_refresh()
        })
    } catch {
        if (ask_elem) {
            ask_elem.innerText = '-'
        }
        if (bid_elem) {
            bid_elem.innerText = '-'
        }
    }
}

function refresh_all() {
    let profit_element = document.getElementById('profit')
    if (profit_element) {
        profit_element.className = ''
    }

    best_bid = [0, 'NONE']
    best_ask = [999999, 'NONE']

    EXCHANGES.forEach(e => {
        get_and_set_last_order(e)
    })
}

var timer = setInterval(refresh_all, 10000)

function kill_timer() {
    clearInterval(timer)
    let kill_button_elem = document.getElementById('kill_button')
    if (kill_button_elem) {
        kill_button_elem.setAttribute('Disabled', '')
        kill_button_elem.value = 'KILLED'
    }
}