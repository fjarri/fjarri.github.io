var ASPECTS = ['robinson', 'A', 'golden'];
var RGB_COLORS = {};
var CMYK_COLORS = {
    'dark': {
        'ocean': [0.901961, 0.643137, 0.184314, 0.407843],
        'main1': [0.576471, 0.0784314, 0.545098, 0.0627451],
        'main2': [0.0980392, 0.827451, 0.513725, 0.0901961],
        'main3': [0.552941, 0.215686, 0.341176, 0.203922],
        'main4': [0.0823529, 0.470588, 0.509804, 0.0509804],
        'main5': [0.282353, 0.152941, 0.631373, 0.0823529],
        'ice2': [0.0431373, 0.180392, 0.0823529, 0.00392157],
        'ice5': [0.105882, 0.0705882, 0.141176, 0.0117647],
        'ice1': [0.160784, 0.0431373, 0.137255, 0.00784314],
        'ice3': [0.160784, 0.0509804, 0.0941176, 0.00784314],
        'iceneutral': [0, 0, 0, 0.0588235]
    },
    'light': {
        'ocean': [0.5, 0.5, 0.5, 0.0],
        'main1': [0.576471, 0.0784314, 0.545098, 0.0627451],
        'main2': [0.0980392, 0.827451, 0.513725, 0.0901961],
        'main3': [0.552941, 0.215686, 0.341176, 0.203922],
        'main4': [0.0823529, 0.470588, 0.509804, 0.0509804],
        'main5': [0.282353, 0.152941, 0.631373, 0.0823529],
        'ice2': [0.0431373, 0.180392, 0.0823529, 0.00392157],
        'ice5': [0.105882, 0.0705882, 0.141176, 0.0117647],
        'ice1': [0.160784, 0.0431373, 0.137255, 0.00784314],
        'ice3': [0.160784, 0.0509804, 0.0941176, 0.00784314],
        'iceneutral': [0, 0, 0, 0.0588235]
    },
    'white': {
        'ocean': [0.0, 0.0, 0.0, 0.0],
        'main1': [0.576471, 0.0784314, 0.545098, 0.0627451],
        'main2': [0.0980392, 0.827451, 0.513725, 0.0901961],
        'main3': [0.552941, 0.215686, 0.341176, 0.203922],
        'main4': [0.0823529, 0.470588, 0.509804, 0.0509804],
        'main5': [0.282353, 0.152941, 0.631373, 0.0823529],
        'ice2': [0.0431373, 0.180392, 0.0823529, 0.00392157],
        'ice5': [0.105882, 0.0705882, 0.141176, 0.0117647],
        'ice1': [0.160784, 0.0431373, 0.137255, 0.00784314],
        'ice3': [0.160784, 0.0509804, 0.0941176, 0.00784314],
        'iceneutral': [0, 0, 0, 0.0588235]
    }};
var CURRENT_ASPECT = null;
var CURRENT_CMYK_COLORS = null;


// approximate algorithm to convert CMYK->RGB
function cmykToRGB(cmyk) {
    var C = cmyk[0];
    var M = cmyk[1];
    var Y = cmyk[2];
    var K = cmyk[3];

    // CMYK -> CMY
    // CMYK values = From 0 to 1
    C = C * (1 - K) + K;
    M = M * (1 - K) + K;
    Y = Y * (1 - K) + K;

    // CMY -> RGB
    // CMY values = From 0 to 1
    var R = Math.round((1 - C) * 255);
    var G = Math.round((1 - M) * 255);
    var B = Math.round((1 - Y) * 255);

    return [R, G, B];
}



function createBackends() {
    for (var i in ASPECTS) {
        var aspect = ASPECTS[i];
        var backend_id = 'map_thumbnail_backend_' + aspect;
        // $('#map_thumbnail_backend').remove();
        $('<canvas>').attr({
            type: 'hidden',
            id: backend_id,
        }).appendTo('body');
        $("#" + backend_id).hide();
    }
}

function loadImages(colors) {

    var image_load_callbacks = [];

    for (var i in ASPECTS) {
        var aspect = ASPECTS[i];

        RGB_COLORS[aspect] = $.extend(true, {}, colors); // deep copy

        var image = new Image();
        image.backend_id = 'map_thumbnail_backend_' + aspect;

        image_load_callbacks.push($.Deferred(function (dfd) {
            $(image).load(function () {
                var src_canvas = $("#" + this.backend_id).get(0);
                src_canvas.width = this.width;
                src_canvas.height = this.height;

                var src_ctx = src_canvas.getContext('2d');
                src_ctx.drawImage(this, 0, 0);
                dfd.resolve();
            });
        }).promise());

        image.src = "http://localhost:8080/textmap/thumbnail800-" + aspect + ".png";
    }

    $.when.apply(this, image_load_callbacks).then(function () {

        // change map colors
        adjustThumbnailColors();

        // If everything is fine,
        // unhide customization machinery and hide the error message
        $("#eps-customizer-error").hide();
        $("#eps-customizer-wrapper").show();
    });
}

function setThumbnailBackend(aspect) {
    CURRENT_ASPECT = aspect;
    var backend = $("#map_thumbnail_backend_" + aspect);
    var canvas = backend.get(0);
    $("#map_thumbnail").attr('src', canvas.toDataURL());
}

function adjustThumbnailColors() {

    var aspect = CURRENT_ASPECT;
    var backend = $("#map_thumbnail_backend_" + aspect);

    var width = backend.width();
    var height = backend.height();
    var oldcolors = RGB_COLORS[aspect];
    var cmyk_newcolors = {};
    var rgb_newcolors = {};

    var canvas = backend.get(0);
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;

    for (var colorname in oldcolors) {
        var pos = 0;
        var cmyk_newcolor = CURRENT_CMYK_COLORS[colorname];
        cmyk_newcolors[colorname] = cmyk_newcolor;

        var newcolor = cmykToRGB(cmyk_newcolor);
        rgb_newcolors[colorname] = newcolor;

        var oldcolor = oldcolors[colorname];

        if (newcolor[0] == oldcolor[0] && newcolor[1] == oldcolor[1] &&
                newcolor[2] == oldcolor[2]) {
            continue;
        }

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                // set red, green, blue, and alpha:
                r = data[pos+0];
                g = data[pos+1];
                b = data[pos+2];
                if (r == oldcolor[0] && g == oldcolor[1] && b == oldcolor[2]) {
                    data[pos+0] = newcolor[0];
                    data[pos+1] = newcolor[1];
                    data[pos+2] = newcolor[2];
                }
                pos += 4;
            }
        }
    }
    RGB_COLORS[aspect] = $.extend(true, {}, rgb_newcolors); // deep copy

    // set link to map
    var link = "http://backend.publicfields.net/textmap/eps?";
    link += "aspect=" + aspect + "&";
    for (var colorname in CURRENT_CMYK_COLORS) {
        link += colorname + "=";
        for (var index in CURRENT_CMYK_COLORS[colorname]) {
            link += CURRENT_CMYK_COLORS[colorname][index];
            if (index < 3) {
                link += ",";
            }
        }
        link += "&";
    }

    $("#eps-link").attr("href", link);


    ctx.putImageData(imageData, 0, 0, width, height);

    setThumbnailBackend(aspect);
}

function setColorFields(palette) {
    console.log("Setting values for palette: " + palette);
    CURRENT_CMYK_COLORS = $.extend(true, {}, CMYK_COLORS[palette]);

    var cmyk_colors = CURRENT_CMYK_COLORS;
    for(var colorname in cmyk_colors) {
        $("#color-group-" + colorname).removeClass("error").addClass("success");
        var colortypes = ['c', 'm', 'y', 'k'];
        for (var index in colortypes) {
            $("#color-" + colorname + "-" + colortypes[index]).attr(
                "value", cmyk_colors[colorname][index]);
        }
    }
}


// Called when the reply from the backend is received
function processColors(colors) {
    $(function() {
        createBackends();

        for (var index in ASPECTS) {
            if ($("#aspect_" + ASPECTS[index]).attr("checked")) {
                CURRENT_ASPECT = ASPECTS[index];
                console.log("Aspect selected: " + ASPECTS[index]);
                break;
            }
        }

        for (var palette in CMYK_COLORS) {
            if ($("#palette-" + palette).attr("checked")) {
                setColorFields(palette);
                console.log("Palette selected: " + palette);
                break;
            };
        }

        loadImages(colors);
    });
}


$(window).resize(function() {
    var width = $("#map_thumbnail").width();
    var src_width = $("#map_thumbnail_backend_robinson").width();
    var src_height = $("#map_thumbnail_backend_robinson").height();
    $("#map_thumbnail").height(width / src_width * src_height);
});



// enable/disable color fields on checkbox state change
$("#show_colors").click(function() {
    if($("#show_colors").is(":checked")) {
        $('[id^="color-"]').each(function(i) {
            $(this).removeClass("disabled");
            $(this).addClass("focused");
            $(this).removeAttr("disabled");
        });
    }
    else {
        $('[id^="color-"]').each(function(i) {
            $(this).removeClass("focused");
            $(this).addClass("disabled");
            $(this).attr("disabled", "");
        });
    }
});

// handlers for aspect changing radios
for (var index in ASPECTS) {
    $("#aspect_" + ASPECTS[index]).change((function(aspect) {
        return function() {
            setThumbnailBackend(aspect);
            adjustThumbnailColors();
        }
    })(ASPECTS[index]));
}

// handlers for changing palettes
for (var palette in CMYK_COLORS) {
    $("#palette-" + palette).change((function(palette) {
        return function() {
            console.log("Requesting palette: " + palette);
            setColorFields(palette);
            adjustThumbnailColors();
        }
    })(palette));
}

// handlers for changing color values
$("#color-values").change(function () {
    var error = false;
    var colortypes = ['c', 'm', 'y', 'k'];

    for(var cname in CMYK_COLORS['dark']) {
        var group_error = false;
        var group_id = "#color-group-" + cname;

        for (var index in colortypes) {
            var value = parseFloat($("#color-" + cname + "-" + colortypes[index]).attr("value"));
            if (isNaN(value) || value < 0 || value > 1) {
                group_error = true;
                break;
            }
        }

        if (group_error) {
            $(group_id).removeClass("success").addClass("error");
            error = true;
        }
        else {
            for (var index in colortypes) {
                CURRENT_CMYK_COLORS[cname][index] =
                    parseFloat($("#color-" + cname + "-" + colortypes[index]).attr("value"));
            }
            $(group_id).removeClass("error").addClass("success");
        }
    }

    if (error) {
        $("#eps-link").attr("href", "javascript:void(alert('One or more of the CMYK" +
            " colors contains incorrect values'))");
    }
    else {
        adjustThumbnailColors();
    }
});

$('#collapseOne').collapse("hide");
