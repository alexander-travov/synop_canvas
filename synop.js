var TILE_SIZE = 22
var TILEMAP = new Image()
TILEMAP.onload = function () {
    var canvas = document.getElementById("synopCanvas")
    var ctx = canvas.getContext("2d")
    var xs = [0.2, 0.4, 0.6, 0.8]
    var ys = [0.2, 0.5, 0.8]
    for (var i = 0; i < xs.length; i++) {
        for (var j = 0; j < ys.length; j++) {
            drawSynop(ctx, xs[i]*canvas.width, ys[j]*canvas.height, generateSynop())
        }
    }
}
TILEMAP.src = "tilemap" + TILE_SIZE + ".png"

GROUP_NUM = {
    'ww':   0,
    'W1': 100,
    'W2': 100,
    'a':  110,
    'CL': 120,
    'CM': 130,
    'CH': 140,
    'N':  150,
}

var GROUP_DX = {
    'ww':    -1.5,
    'W1':     1.5,
    'W2':     2.5,
    'a':      2.5,
    'CL':    -0.5,
    'CM':    -0.5,
    'CH':    -0.5,
    'N':     -0.5,
    'TTT':   -0.6,
    'VV':    -1.6,
    'TdTdTd':-0.6,
    'PPP':    2.4,
    'ppp':    2.4,
    'Nh':     1.3,
    'hshs':   1.5,
}

var GROUP_DY = {
    'ww':    -0.5,
    'W1':     0.5,
    'W2':     0.5,
    'a':     -0.5,
    'CL':     0.5,
    'CM':    -1.5,
    'CH':    -2.5,
    'N':     -0.5,
    'TTT':   -1.5,
    'VV':    -0.5,
    'TdTdTd': 0.5,
    'PPP':   -1.5,
    'ppp':   -0.5,
    'Nh':     0.5,
    'hshs':   1.5,
}

function drawTile(ctx, dx, dy, tileNum) {
    var row = Math.floor(tileNum / 10)
    var col = tileNum % 10
    ctx.drawImage(TILEMAP,
        col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        dx * TILE_SIZE, dy * TILE_SIZE, TILE_SIZE, TILE_SIZE
    )
}

function drawGroupTile(ctx, group, code) {
    var dx = GROUP_DX[group]
    var dy = GROUP_DY[group]
    var tileNum = GROUP_NUM[group] + code
    drawTile(ctx, dx, dy, tileNum)
}

function drawText(ctx, group, text) {
    var dx = GROUP_DX[group]
    var dy = GROUP_DY[group]
    ctx.fillText(text, dx * TILE_SIZE, dy * TILE_SIZE + TILE_SIZE / 5)
}

function drawArrow(ctx, speed, direction) {
    // no wind
    if (speed === 0) {
        ctx.beginPath()
        ctx.arc(0, 0, TILE_SIZE/2+1, 0, 2*Math.PI, false)
        ctx.closePath()
        ctx.stroke()
        return
    }

    var length = TILE_SIZE * 4.7
    var dx = TILE_SIZE / 5
    var dy = TILE_SIZE
    var numTriangles = Math.floor((speed + 1) / 25)
    var numLines = Math.floor((speed + 1) % 25 / 5)
    var half = (speed + 1) % 5 >= 3

    ctx.save()

    ctx.rotate(Math.PI * direction / 180)

    // direction line
    ctx.strokeStyle = "#888888"
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(length, 0)
    ctx.closePath()
    ctx.stroke()
    ctx.strokeStyle = "#000000"

    // triangular feathers
    var fx = length // feather x coordinate
    for (var i = 0; i < numTriangles; i++) {
        ctx.beginPath()
        ctx.moveTo(fx, 0)
        ctx.lineTo(fx, dy)
        ctx.lineTo(fx - dx, 0)
        ctx.closePath()
        ctx.fill()
        fx -= dx
    }
    if (numTriangles > 0) fx -= dx

    // line feathers
    ctx.beginPath()
    for (var i = 0; i < numLines; i++) {
        ctx.moveTo(fx, 0)
        ctx.lineTo(fx + dx, dy)
        fx -= dx
    }

    if (half) {
        ctx.moveTo(fx, 0)
        ctx.lineTo(fx + dx/2, dy/2)
    }
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
}

// Past weather W1W2 code table 4561
function drawWTile(ctx, synop, W) {
    if (synop[W] !== 3) drawGroupTile(ctx, W, synop[W])
    else {
        var TTT = synop['TTT']
        if (TTT > 0) drawTile(ctx, GROUP_DX[W], GROUP_DY[W], 31) // Dust storm
        else drawTile(ctx, GROUP_DX[W], GROUP_DY[W], 38) // Blizzard
    }
}

function drawSynop(ctx, x, y, synop) {
    ctx.save()

    ctx.setTransform(1, 0, 0, 1, x, y)
    ctx.fillStyle = "#000000"
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 1
    ctx.font = "normal normal " + TILE_SIZE/1.5 + "px sans-serif"
    ctx.textBaseline = "top"
    ctx.textAlign = "end"

    // Оперение скорости
    if (synop['ff'] != undefined && synop['dd'] != undefined)
        drawArrow(ctx, synop['ff'], synop['dd'])

    var tileGroups = ["N", "ww", "CL", "CM", "CH", "a"]
    for (var i = 0; i < tileGroups.length; i++) {
        var g = tileGroups[i]
        if (synop[g] != undefined) drawGroupTile(ctx, g, synop[g])
    }

    // W1W2 Прошедшая погода КН-01 кт4561
    var W1 = synop['W1']
    var W2 = synop['W2']
    drawWTile(ctx, synop, 'W1')
    if (W2 < W1) drawWTile(ctx, synop, 'W2')
    else if (W2 === W1 && W1 > 2) drawTile(ctx, GROUP_DX['W2'], GROUP_DY['W2'], GROUP_NUM['N']+9) // Sky can't be seen

    var textGroups = ["TTT", "TdTdTd", "VV", "PPP", "ppp", "Nh", "hshs"]
    for (var i = 0; i < textGroups.length; i++) {
        var g = textGroups[i]
        if (synop[g] != undefined) drawText(ctx, g, synop[g])
    }

    ctx.restore()
}

Number.prototype.pad = function(size) {
    var s = String(this)
    while (s.length < (size || 2)) {s = "0" + s}
    return s
}

function generateSynop() {
    var N = Math.floor(10 * Math.random())
    var Nh = Math.floor(N * Math.random())
    var W1 = Math.floor(10 * Math.random())
    var W2 = Math.floor((W1 + 1) * Math.random())
    var a = Math.floor(10 * Math.random())
    var ppp = (20 * Math.random() * (a > 4 ? -1 : 1)).toFixed(1)
    var TTT = 60 * Math.random() - 30
    var TdTdTd = TTT - 5 * Math.random()
    return {
        "ff": Math.floor(50 * Math.random()),
        "dd": Math.floor(360 * Math.random()),
        "N": N,
        "Nh": Nh,
        "ww": Math.floor(100 * Math.random()),
        "W1": W1,
        "W2": W2,
        "CL": Math.floor(10 * Math.random()),
        "CM": Math.floor(10 * Math.random()),
        "CH": Math.floor(10 * Math.random()),
        "PPP": Math.floor(100 * Math.random()).pad(3),
        "a": a,
        "ppp": ppp,
        "TTT": TTT.toFixed(1),
        "TdTdTd": TdTdTd.toFixed(1),
        "VV": Math.floor(100 * Math.random()).pad(2),
        "hshs": Math.floor(100 * Math.random()).pad(2),
    }
}
