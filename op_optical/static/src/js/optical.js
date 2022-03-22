odoo.define("op_optical.configurator", function (require) {
  "use strict";
  var ajax = require("web.ajax");
  var core = require("web.core");
  var publicWidget = require("web.public.widget");
  var config = require("web.config");
  publicWidget.registry.LensPrescription = publicWidget.Widget.extend({
    selector: ".oe_presecription_form",
    events: {
      "click #right_lens_diameter, #left_lens_diameter": "_select_lens_side",
      "change input[name='lens_side']": "_select_lens_side",
      "change #l_prism, #r_prism": "_handle_prism",
      "click #save_prescription": "_handle_submit",
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _select_lens_side: function () {

      var lens_side = $("input[name='lens_side']:checked").val();
      switch (lens_side) {
        case "left":
          $(".right_lens_side").hide();
          $(".left_lens_side").show();
          break;
        case "right":
          $(".right_lens_side").show();
          $(".left_lens_side").hide();
          break;
        default:
          $(".right_lens_side").show();
          $(".left_lens_side").show();
          break;
      }
    },
    _handle_prism: function (ev) {

      var $input = $(ev.currentTarget);
      switch ($input.attr("id")) {
        case "l_prism":
          if ($input.is(":checked") == true) {
            $(".l_prism_attr").show();
          } else {
            $(".l_prism_attr").hide();
          }
          break;
        case "r_prism":
          if ($input.is(":checked") == true) {
            $(".r_prism_attr").show();
          } else {
            $(".r_prism_attr").hide();
          }
          break;
        default:
          $(".l_prism_attr").hide();
          $(".r_prism_attr").hide();
          break;
      }
    },
    _handle_submit: function (ev) {
      var lens_side = $("input[name='lens_side']:checked").val();
      var o_line_id = $(".oe_presecription_form").data("line_id");

      var l_sphere = $("#l_sphere").val();
      var l_cylinder = $("#l_cylinder").val();
      var l_axis = $("#l_axis").val();
      var l_addition = $("#l_addition").val();
      var l_prism1 = $("#l_prism1").val();
      var l_prism2 = $("#l_prism2").val();
      var l_base1 = $("#l_base1").val();
      var l_base2 = $("#l_base2").val();
      var left_lens_diameter = $(
        "input[name='left_lens_diameter']:checked"
      ).val();

      var r_sphere = $("#r_sphere").val();
      var r_cylinder = $("#r_cylinder").val();
      var r_axis = $("#r_axis").val();
      var r_addition = $("#r_addition").val();
      var r_prism1 = $("#r_prism1").val();
      var r_prism2 = $("#r_prism2").val();
      var r_base1 = $("#r_base1").val();
      var r_base2 = $("#r_base2").val();
      var right_lens_diameter = $(
        "input[name='right_lens_diameter']:checked"
      ).val();

      this._rpc({
        route: "/shop/cart/update/prescription",
        params: {
          o_line_id: parseInt(o_line_id),
          lens_side: lens_side,
          l_sphere: parseFloat(l_sphere),
          l_cylinder: parseFloat(l_cylinder),
          l_axis: parseFloat(l_axis),
          l_addition: parseFloat(l_addition),
          l_prism1: parseFloat(l_prism1),
          l_prism2: parseFloat(l_prism2),
          l_base1: parseFloat(l_base1),
          l_base2: parseFloat(l_base2),
          l_diameter_id: parseInt(left_lens_diameter),
          r_sphere: parseFloat(r_sphere),
          r_cylinder: parseFloat(r_cylinder),
          r_axis: parseFloat(r_axis),
          r_addition: parseFloat(r_addition),
          r_prism1: parseFloat(r_prism1),
          r_prism2: parseFloat(r_prism2),
          r_base1: parseFloat(r_base1),
          r_base2: parseFloat(r_base2),
          r_diameter_id: parseInt(right_lens_diameter),
        },
      });
    },
  });
});
