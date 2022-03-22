odoo.define("op_optical.shop", function (require) {
  "use strict";
  $("#_pres_r_sphere").attr('required', '');
  var ajax = require("web.ajax");
  var core = require("web.core");
  var QWeb = core.qweb;
  var xml_load = ajax.loadXML('/op_optical/static/src/xml/template.xml',QWeb);
  var publicWidget = require("web.public.widget");
  var config = require("web.config");
  var rpc = require('web.rpc');
  var utils = require("web.utils");

  publicWidget.registry.LensShop = publicWidget.Widget.extend({
    product_category: 0,
    selector: ".lens_sale",
    events: {
      "click .button-decrement, .button-increment": "_handle_filter_ranges",
      "change .cylinder_prifix_vales": "_handle_cylinder_values",
//      "click #axis_button_increment_left": "_axis_range_incr_left",
      "click .page_shift, .next_div": "_page_change_onclick",
//      "click #axis_button_decrement_left": "_axis_range_decr_left",
      "click .rad-design.product_color_radio": "_product_color_radio",
      "click .rad-design.product_coating_radio": "_product_coating_radio",
//      "click .product_coating_radio": "_product_coating_data",
//      "click #axis_button_increment_right": "_axis_range_incr_right",
//      "click #axis_button_decrement_right": "_axis_range_decr_right",
      "click #pd_right_default_id": "_click_pd_right_default_id",
      "click #pd_right_default_id2": "_click_pd_right_default_id2",
      "click #hsa-right-default_id": "_click_hsa_right",
      "click #vorneigung-default_id": "_click_vorneigung",
      "click #fsw-default_id": "_click_fsw",
      "click #obj-id": "_click_obj",
      "change #_pres_r_axis" : "_convert_into_integer_r",
      "change #_pres_l_axis" : "_convert_into_integer_l",
      "click #btn_reset": "_handle_reset",
      "click #btn_filter": "_handle_filter",
      "click .product_category": "_handle_category_filter",
      "click .list-group-item-action": "_show_products",
      "click ._product": "_show_prescription",
      "change .input-number": "_validate_input",
      "change input[name='lens_side']": "_select_lens_side",
      "change #_pres_l_prism, #_pres_r_prism": "_handle_prism",
      "click #save_prescription": "_handle_submit",
      "click #search_lenses": "_handle_search_lenses",
      "click #nextbutton-sidebar1, #choose_product": "_handle_choose_product",
      "click .left_lens_diameter"  : "_set_left_ranges",
      "click .right_lens_diameter"  : "_set_right_ranges",
      "click .btn-left-right": "_set_left_right",
      "click #_pres_r_prism": "_set_left_prism",
      "click .open-info": "_show_modal",
      "click .product_info_span": "_show_product_info_modal",
      "click .selected_color": "_show_color_img",
      "click #nextbutton-prescription, .ind, .colo, .coa": "_validate_input_field",
      "click #reference_number": "_check_reference_number",
      "focusout .input-number.right, .input-number.left": "_convert_num_into_float",
      "click .flash_select": "_show_flash_coating_img",
      "focus .input-number": "_select_all_input_text",
      "change input[name='cylinder_prefix']": "_check_cylinder_prefix",
    },

    /**
     * @constructor
     */
    init: function () {
      this._super.apply(this, arguments);
      this._handle_reset();
      console.log(utils.get_cookie("lens_prescription"));
        var input = document.getElementById('_pres_l_sphere').value
      var parsed_val = parseFloat(input)
      if (parsed_val == 0.00){
          document.getElementById("choose_product").style.visibility = "hidden";
          alert("sphere field is required")
      }
    },
    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */

    _click_pd_right_default_id: function (ev) {
      ev.currentTarget.checked = true
      $("#pd_right_default_id").val(true)
      var value = $("#right_pupil_distance_standard").text()
      $("#pd_right_field").val(value)

      $("#pd_right_field").removeClass('_err');
      $("#pd_right_field").css("border", "black");
      $("#pd_right_field").css("border-radius", "1px");
    },
    _click_pd_right_default_id2: function (ev) {

      ev.currentTarget.checked = true
      $("#pd_right_default_id2").val(true)
      var value = $("#left_pupil_distance_standard").text()
      $("#pd_left_field").val(value)

      $("#pd_left_field").removeClass('_err');
      $("#pd_left_field").css("border", "black");
      $("#pd_left_field").css("border-radius", "1px");
    },
    _click_hsa_right: function (ev) {
      ev.currentTarget.checked = true
      $("#hsa-right-default_id").val(true)
      var value = $("#bvd_standard").text()
      $("#hsa_right_field").val(value)

      $("#hsa_right_field").removeClass('_err');
      $("#hsa_right_field").css("border", "black");
      $("#hsa_right_field").css("border-radius", "1px");
    },
    _click_vorneigung: function (ev) {
      ev.currentTarget.checked = true
      $("#vorneigung-default_id").val(true)
      var value = $("#panta_standard").text()
      $("#vorneigung_field").val(value)

      $("#vorneigung_field").removeClass('_err');
      $("#vorneigung_field").css("border", "black");
      $("#vorneigung_field").css("border-radius", "1px");
    },
    _click_fsw: function (ev) {
      ev.currentTarget.checked = true
      $("#fsw-default_id").val(true)
      var value = $("#ba_standard").text()
      $("#scheibenwinkel_field").val(value)

      $("#scheibenwinkel_field").removeClass('_err');
      $("#scheibenwinkel_field").css("border", "black");
      $("#scheibenwinkel_field").css("border-radius", "1px");
    },
    _click_obj: function (ev) {
      ev.currentTarget.checked = true
      $("#obj-id").val(true)
      var value = $("#nod_standard").text()
      $("#distance_field").val(value)

      $("#distance_field").removeClass('_err');
      $("#distance_field").css("border", "black");
      $("#distance_field").css("border-radius", "1px");
    },
    _handle_reset: function (ev) {
      $(".input-number").each(function () {
        $(this).val("");
      });
      this.product_category = 0;
      this._handle_filter();
    },
    _validate_input: function (ev) {
      if (ev.target.id == "pd_right_field"){
        $("#pd_right_field").css("border", "black");
        $("#pd_right_field").css("border-radius", "1px");

        $("#pd_right_field").removeClass('_err');

        $("#pd_right_default_id").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#pd_right_field").addClass('_err');
//            document.getElementById("error_pd").innerHTML = "Value outside allowed range";
        }
        else {

            ev.currentTarget.style.color = 'black';
            $('#pd_right_default_id').val(true);
            $("#pd_right_field").removeClass('_err');
//            document.getElementById("error_pd").innerHTML = ""
        }

      } //end if

      else if (ev.target.id == "pd_left_field"){
        $("#pd_left_field").css("border", "black");
        $("#pd_left_field").css("border-radius", "1px");

        $("#pd_left_field").removeClass('_err');

        $("#pd_right_default_id2").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#pd_left_field").addClass('_err');
//            document.getElementById("error_pd").innerHTML = "Value outside allowed range";
        }
        else {
            ev.currentTarget.style.color = 'black';
            $('#pd_right_default_id2').val(true)
            $('#pd_right_default_id2').value =true;
            $("#pd_right_default_id2").checked= true;
            $("#pd_left_field").removeClass('_err');
//            document.getElementById("error_pd").innerHTML = ""
        }

      }

      else if (ev.target.id == "hsa_right_field"){
        $("#hsa_right_field").css("border", "black");
        $("#hsa_right_field").css("border-radius", "1px");

        $("#hsa_right_field").removeClass('_err');

        $("#hsa-right-default_id").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#hsa_right_field").addClass('_err');
//            document.getElementById("error_bvd").innerHTML = "Value outside allowed range";
        }
        else {
            ev.currentTarget.style.color = 'black';
            $('#hsa-right-default_id').value =true;
            $("#hsa-right-default_id").checked= true;
            $("#hsa_right_field").removeClass('_err');
//            document.getElementById("error_bvd").innerHTML = ""
        }

      }

      else if (ev.target.id == "vorneigung_field"){
        $("#vorneigung_field").css("border", "black");
        $("#vorneigung_field").css("border-radius", "1px");

        $("#vorneigung_field").removeClass('_err');

        $("#vorneigung-default_id").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#vorneigung_field").addClass('_err');
//            document.getElementById("error_panta").innerHTML = "Value outside allowed range";
        }
        else{
            ev.currentTarget.style.color = 'black';
            $('#vorneigung-default_id').value =true;
            $("#vorneigung-default_id").checked= true;
            $("#vorneigung_field").removeClass('_err');
//            document.getElementById("error_panta").innerHTML = ""
        }

      }

      else if (ev.target.id == "scheibenwinkel_field"){
        $("#scheibenwinkel_field").css("border", "black");
        $("#scheibenwinkel_field").css("border-radius", "1px");

        $("#scheibenwinkel_field").removeClass('_err');

        $("#fsw-default_id").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#scheibenwinkel_field").addClass('_err');
//            document.getElementById("error_ba").innerHTML = "Value outside allowed range";
        }
        else {
            ev.currentTarget.style.color = 'black';
            $('#fsw-default_id').value =true;
            $("#fsw-default_id").checked= true;
            $("#scheibenwinkel_field").removeClass('_err');
//            document.getElementById("error_ba").innerHTML = ""
        }

      }

      else if (ev.target.id == "distance_field"){
        $("#distance_field").css("border", "black");
        $("#distance_field").css("border-radius", "1px");

        $("#distance_field").removeClass('_err');

        $("#obj-id").prop('checked', false);
        var mini = parseFloat(ev.target.min);
        var maxi = parseFloat(ev.target.max);
        var input = parseFloat(ev.target.value);
        if (input < mini || input > maxi){
            ev.currentTarget.style.color = 'red';
            $("#distance_field").addClass('_err');
//            document.getElementById("error_nod").innerHTML = "Value outside allowed range";
        }
        else {
            ev.currentTarget.style.color = 'black';
            $('#obj-id').value =true;
            $("#obj-id").checked= true;
            $("#distance_field").removeClass('_err');
//            document.getElementById("error_nod").innerHTML = ""
        }

      }
      else if (ev.target.id == "fittingheight_select"){
        $("#fittingheight_select").css("border", "black");
        $("#fittingheight_select").css("border-radius", "1px");
      }
     document.getElementById("ranges_alert_right").innerHTML = " "
     if($(ev.target).hasClass("right")){
        if(!$('.right_lens_diameter').is(":checked")){
            document.getElementById("ranges_alert_right").innerHTML = "Select Right Diameter";
            return;
        }
     }
     if($(ev.target).hasClass("left")){
        if(!$('.left_lens_diameter').is(":checked")){
            document.getElementById("ranges_alert_right").innerHTML = "Select Left Diameter";
            return;
        }
     }
     if (ev.target.id != ""){
          var $field = $('#' + ev.target.id);
          var rawvalue = $field.val().replace("'","");
          var thisval = new Number(rawvalue.replace(",","."));
          var step = Number($field.attr("data-step"));

          var precision = parseFloat($("input[type='radio'][name='dpt']:checked").val());
          thisval = Math.round(thisval*(1/precision))/(1/precision);
          if (step > 0.50){
            thisval= thisval.toFixed(0);
          }else{
             thisval= thisval.toFixed(2);
          }
          $field.val(thisval);

     }
      var min = parseFloat($(ev.target).attr("data-min"));
      var max = parseFloat($(ev.target).attr("data-max"));
      var value = parseFloat($(ev.target).val());
//      var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();

      if ((min <= value && value <= max) || isNaN(value)){
        $(ev.target).closest(".incr-decr-control").removeClass("_err");
        document.getElementById("ranges_alert_left").innerHTML = "";
        document.getElementById("ranges_alert_right").innerHTML = "";

      }
      else {
        if ($(ev.target).hasClass("right")){
           document.getElementById("ranges_alert_right").innerHTML = ""
           document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
           $(ev.target).closest(".incr-decr-control").addClass("_err");
        }
        else {
           document.getElementById("ranges_alert_left").innerHTML = ""
           document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
           $(ev.target).closest(".incr-decr-control").addClass("_err");
        }

      }

      //***************  Change Cylinder Range onchange of sphere value ************************
          var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();
          if (clicked_value == '+'){
            this._cylinder_prefix_plus();
          }
          // ***************************** Check if Cylinder Prefix - is checked **************************************
          if (clicked_value == '-'){
            this._cylinder_prefix_minus();
          }

    },
    _page_change_onclick: function(ev){
        var ref = ev.currentTarget.attributes.href.value;
        if (!$("input[name=reference_number]").val()) {
            $("input[name=reference_number]").css("border", "2px solid red");
            $("input[name=reference_number]").css("border-radius", "4px");
            $("#reference_number_text").show();
            $("#individual_page").hide();

            $("#prescription_page").show();
        }
        else if (ref == "#priscription"){
            $(".pres").addClass("active");
            $(".ind").addClass("done");
            $(".colo").addClass("done");
            $(".coa").addClass("done");

            $(".ind").removeClass("active");
            $(".coa").removeClass("active");
            $(".colo").removeClass("active");

            document.getElementById("prescription_page").style.display="block";
            document.getElementById("color_page").style.display="none";
            document.getElementById("individual_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
        }
        else if (ref == "#individual_page"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }

            $(".ind").addClass("active");
            $(".pres").addClass("done");
            $(".colo").addClass("done");
            $(".coa").addClass("done");

            $(".pres").removeClass("active");
            $(".colo").removeClass("active");
            $(".coa").removeClass("active");

            document.getElementById("individual_page").style.display="block";
            document.getElementById("color_page").style.display="none";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
        }
        else if (ref == "#color_page"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }
            $(".colo").addClass("active");
            $(".pres").addClass("done");
            $(".ind").addClass("done");
            $(".coa").addClass("done");

            $(".pres").removeClass("active");
            $(".ind").removeClass("active");
            $(".coa").removeClass("active");


//            this.$('#color_page').html(QWeb.render('ImportView.preview', result));

            document.getElementById("color_page").style.display="block";
            document.getElementById("individual_page").style.display="none";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
        }
        else if (ref == "#coating_page"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }
            $(".coa").addClass("active");
            $(".pres").addClass("done");
            $(".colo").addClass("done");
            $(".ind").addClass("done");

            $(".pres").removeClass("active");
            $(".ind").removeClass("active");
            $(".colo").removeClass("active");

            document.getElementById("coating_page").style.display="block";
            document.getElementById("individual_page").style.display="none";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("color_page").style.display="none";
        }
        else if (ref == "#backperscription"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }
            $(".pres").addClass("active");
            $(".coa").addClass("done");
            $(".colo").addClass("done");
            $(".ind").addClass("done");

            $(".coa").removeClass("active");
            $(".ind").removeClass("active");
            $(".colo").removeClass("active");

            document.getElementById("prescription_page").style.display="block";
            document.getElementById("individual_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
            document.getElementById("color_page").style.display="none";
        }
        else if (ref == "#backindividual"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }
            $(".ind").addClass("active");
            $(".coa").addClass("done");
            $(".colo").addClass("done");
            $(".pres").addClass("done");

            $(".coa").removeClass("active");
            $(".pres").removeClass("active");
            $(".colo").removeClass("active");

            document.getElementById("individual_page").style.display="block";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
            document.getElementById("color_page").style.display="none";
        }
        else if (ref == "#backcolor"){
            if ($(".incr-decr-control").hasClass("_err")){
                return;
            }
            $(".ind").addClass("done");
            $(".coa").addClass("done");
            $(".colo").addClass("active");
            $(".pres").addClass("done");

            $(".coa").removeClass("active");
            $(".pres").removeClass("active");
            $(".ind").removeClass("active");

            document.getElementById("individual_page").style.display="none";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
            document.getElementById("color_page").style.display="block";
        }
        else if(ref == "#shop"){
            document.getElementById("individual_page").style.display="none";
            document.getElementById("prescription_page").style.display="none";
            document.getElementById("coating_page").style.display="none";
            document.getElementById("color_page").style.display="none";

            $(".coa").removeClass("active");
            $(".colo").removeClass("active");
            $(".pres").removeClass("active");
            $(".ind").removeClass("active");

            window.location.href = "/shop";

        }

    },
    _set_left_ranges: function(ev){

        var diameter_id = parseInt(ev.currentTarget.attributes.value.value);

        var self = this;
        this._rpc({ route: "/get_diameter",
         params: { id : diameter_id }, }).then(function(data){

            self._set_prescription_range("_pres_l_cylinder",data.cylinder_range_min, data.cylinder_range_max, 0);
            self._set_prescription_range("_pres_l_sphere",data.sphere_range_min, data.sphere_range_max, 0);
            self._set_prescription_range("_pres_l_addition",data.additional_range_min, data.additional_range_max, 0);
            self._set_prescription_range("_pres_l_prism1",data.prism_range_min, data.prism_range_max, 0);
            self._set_prescription_range("_pres_l_prism2",data.prism_range_min, data.prism_range_max, 0);

            var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();
            if (clicked_value == "-"){
                self._shuffle_left_side_range_text("cylinder");
            }

            if((parseFloat($('#_pres_l_sphere').val()) < parseFloat($('#_pres_l_sphere').attr('data-min'))) || (parseFloat($('#_pres_l_sphere').val()) > parseFloat($('#_pres_l_sphere').attr('data-max')))){
                var pres_l_sphere = $('#_pres_l_sphere')
                self._check_input_value(pres_l_sphere);
            }
            if((parseFloat($('#_pres_l_cylinder').val()) < parseFloat($('#_pres_l_cylinder').attr('data-min'))) || (parseFloat($('#_pres_l_cylinder').val()) > parseFloat($('#_pres_l_cylinder').attr('data-max')))){
                var pres_l_cylinder = $('#_pres_l_cylinder')
                self._check_input_value(pres_l_cylinder);
            }
            if((parseFloat($('#_pres_l_axis').val()) < parseFloat($('#_pres_l_axis').attr('data-min'))) || (parseFloat($('#_pres_l_axis').val()) > parseFloat($('#_pres_l_axis').attr('data-max')))){
                var pres_l_axis = $('#_pres_l_axis')
                self._check_input_value(pres_l_axis);
            }
            if((parseFloat($('#_pres_l_addition').val()) < parseFloat($('#_pres_l_addition').attr('data-min'))) || (parseFloat($('#_pres_l_addition').val()) > parseFloat($('#_pres_l_addition').attr('data-max')))){
                var pres_l_addition = $('#_pres_l_addition')
                self._check_input_value(pres_l_addition);
            }
            if((parseFloat($('#_pres_l_prism1').val()) < parseFloat($('#_pres_l_prism1').attr('data-min'))) || (parseFloat($('#_pres_l_prism1').val()) > parseFloat($('#_pres_l_prism1').attr('data-max')))){
                var pres_l_prism1 = $('#_pres_l_prism1')
                self._check_input_value(pres_l_prism1);
            }
            if((parseFloat($('#_pres_l_prism2').val()) < parseFloat($('#_pres_l_prism2').attr('data-min'))) || (parseFloat($('#_pres_l_prism2').val()) > parseFloat($('#_pres_l_prism2').attr('data-max')))){
                var pres_l_prism2 = $('#_pres_l_prism2')
                self._check_input_value(pres_l_prism2);
            }
            if((parseFloat($('#_pres_l_base1').val()) < parseFloat($('#_pres_l_base1').attr('data-min'))) || (parseFloat($('#_pres_l_base1').val()) > parseFloat($('#_pres_l_base1').attr('data-max')))){
                var pres_l_base1 = $('#_pres_l_base1')
                self._check_input_value(pres_l_base1);
            }
            if((parseFloat($('#_pres_l_base2').val()) < parseFloat($('#_pres_l_base2').attr('data-min'))) || (parseFloat($('#_pres_l_base2').val()) > parseFloat($('#_pres_l_base2').attr('data-max')))){
                var pres_l_base2 = $('#_pres_l_base2')
                self._check_input_value(pres_l_base2);
            }
         });
    },
    _set_right_ranges: function(ev){
        var diameter_id = parseInt(ev.currentTarget.attributes.value.value);
        var self = this;
        this._rpc({ route: "/get_diameter",
         params: { id : diameter_id }, }).then(function(data){

            self._set_prescription_range("_pres_r_cylinder",data.cylinder_range_min, data.cylinder_range_max, 0);
            self._set_prescription_range("_pres_r_sphere",data.sphere_range_min, data.sphere_range_max, 0);
            self._set_prescription_range("_pres_r_addition",data.additional_range_min, data.additional_range_max, 0);
            self._set_prescription_range("_pres_r_prism1",data.prism_range_min, data.prism_range_max, 0);
            self._set_prescription_range("_pres_r_prism2",data.prism_range_min, data.prism_range_max, 0);

            var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();
            if (clicked_value == "-"){
                self._shuffle_right_side_range_text("cylinder");
            }

            if($('#_pres_r_sphere').val()){
                if((parseFloat($('#_pres_r_sphere').val()) < parseFloat($('#_pres_r_sphere').attr('data-min'))) || (parseFloat($('#_pres_r_sphere').val()) > parseFloat($('#_pres_r_sphere').attr('data-max')))){
                    var pres_r_sphere = $('#_pres_r_sphere')
                    self._check_input_value(pres_r_sphere);
                }
            }
            if((parseFloat($('#_pres_r_cylinder').val()) < parseFloat($('#_pres_r_cylinder').attr('data-min'))) || (parseFloat($('#_pres_r_cylinder').val()) > parseFloat($('#_pres_r_cylinder').attr('data-max')))){
                var pres_r_cylinder = $('#_pres_r_cylinder')
                self._check_input_value(pres_r_cylinder);
            }
            if((parseFloat($('#_pres_r_axis').val()) < parseFloat($('#_pres_r_axis').attr('data-min'))) || (parseFloat($('#_pres_r_axis').val()) > parseFloat($('#_pres_r_axis').attr('data-max')))){
                var pres_r_axis = $('#_pres_r_axis')
                self._check_input_value(pres_r_axis);
            }
            if((parseFloat($('#_pres_r_addition').val()) < parseFloat($('#_pres_r_addition').attr('data-min'))) || (parseFloat($('#_pres_r_addition').val()) > parseFloat($('#_pres_r_addition').attr('data-max')))){
                var pres_r_addition = $('#_pres_r_addition')
                self._check_input_value(pres_r_addition);
            }
            if((parseFloat($('#_pres_r_prism1').val()) < parseFloat($('#_pres_r_prism1').attr('data-min'))) || (parseFloat($('#_pres_r_prism1').val()) > parseFloat($('#_pres_r_prism1').attr('data-max')))){
                var pres_r_prism1 = $('#_pres_r_prism1')
                self._check_input_value(pres_r_prism1);
            }
            if((parseFloat($('#_pres_r_prism2').val()) < parseFloat($('#_pres_r_prism2').attr('data-min'))) || (parseFloat($('#_pres_r_prism2').val()) > parseFloat($('#_pres_r_prism2').attr('data-max')))){
                var pres_r_prism2 = $('#_pres_r_prism2')
                self._check_input_value(pres_r_prism2);
            }
            if((parseFloat($('#_pres_r_base1').val()) < parseFloat($('#_pres_r_base1').attr('data-min'))) || (parseFloat($('#_pres_r_base1').val()) > parseFloat($('#_pres_r_base1').attr('data-max')))){
                var pres_r_base1 = $('#_pres_r_base1')
                self._check_input_value(pres_r_base1);
            }
            if((parseFloat($('#_pres_r_base2').val()) < parseFloat($('#_pres_r_base2').attr('data-min'))) || (parseFloat($('#_pres_r_base2').val()) > parseFloat($('#_pres_r_base2').attr('data-max')))){
                var pres_r_base2 = $('#_pres_r_base2')
                self._check_input_value(pres_r_base2);
            }
         });
    },
    _handle_filter: function (ev) {
        var lens_side = "Both";
        var r_sphere = 0;
        var r_cylinder = 0;
        var r_axis = 0;
        var r_addition = 0;
        var r_pupil_distance = 0;

        var l_sphere = 0;
        var l_cylinder = 0;
        var l_axis = 0;
        var l_addition = 0;
        var l_pupil_distance = 0;
        
        
        
        if (ev){
            if(ev.currentTarget.value == 'Filter'){
              r_sphere = $("#r_sphere").val();
              r_cylinder = $("#r_cylinder").val();
              r_axis = $("#r_axis").val();
              r_addition = $("#r_addition").val();
              r_pupil_distance = $("#r_pupil_distance").val();

              l_sphere = $("#l_sphere").val();
              l_cylinder = $("#l_cylinder").val();
              l_axis = $("#l_axis").val();
              l_addition = $("#l_addition").val();
              l_pupil_distance = $("#r_pupil_distance").val();
            }
        }

      this._rpc({
        route: "/find_products",
        params: {
          lens_side: lens_side,
          l_sphere: parseFloat(l_sphere),
          l_cylinder: parseFloat(l_cylinder),
          l_axis: parseFloat(l_axis),
          l_addition: parseFloat(l_addition),
          l_pupil_distance: parseFloat(l_pupil_distance),

          r_sphere: parseFloat(r_sphere),
          r_cylinder: parseFloat(r_cylinder),
          r_axis: parseFloat(r_axis),
          r_addition: parseFloat(r_addition),
          r_pupil_distance: parseFloat(r_pupil_distance),
          product_category: this.product_category,
        },
      }).then(function (r) {

        $("tr._tr").remove();
        var products = r.products;
        var currency_symbol = r.currency_symbol;
        var user_name = r.user_name;
        $("#pres_user_name").text(user_name);

        products.forEach((pr) => {
          var attrs = "";
          Object.entries(pr).forEach((attr) => {
            const [key, value] = attr;
            if (
              key == "dioptre_option" ||
              key == "diameter_option" ||
              key == "progression_length_option"
            ) {
              attrs =
                attrs + " data-" + key + "=" + btoa(JSON.stringify(value));
            } else {
              attrs = attrs + " data-" + key + "=" + value;
            }
          });

          var tr_html =
            '<tr class="_tr"><td><a class="_product" href="javascript:void(0);" ' +
            attrs +
            ">" +
            pr.name +
            "</a></td><td>" +
            (pr.edi_code ? pr.edi_code : "-") +
            "</td><td>" +
            pr.price + " "+currency_symbol+
            "</td></tr>";
          $("#product_table").append(tr_html);
        });
      });
    },
    _handle_cylinder_values: function (ev) {
      //input values of right side
      var spahre_inp_r = parseFloat(document.getElementById("_pres_r_sphere").value);
      var cylinder_value_r = parseFloat(document.getElementById("_pres_r_cylinder").value);
      var axis_in_r = parseFloat(document.getElementById("_pres_r_axis").value);
      //input values of right side
      var spahre_inp_l = parseFloat(document.getElementById("_pres_l_sphere").value);
      var cylinder_value_l = parseFloat(document.getElementById("_pres_l_cylinder").value);
      var axis_in_l = parseFloat(document.getElementById("_pres_l_axis").value);

      var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();
      if (clicked_value == "-"){
      
      
      
      

      document.getElementById("_pres_r_sphere").value = (spahre_inp_r + cylinder_value_r).toFixed(2);
      document.getElementById("_pres_r_axis").value = axis_in_r + 90;

      document.getElementById("_pres_l_sphere").value = (spahre_inp_l + cylinder_value_l).toFixed(2);
      document.getElementById("_pres_l_axis").value = axis_in_l + 90;

      //getting values of both sides of lenses and adding minus on them
        var cylinder_value_r = document.getElementById("_pres_r_cylinder").value;
        var cylinder_value_l = document.getElementById("_pres_l_cylinder").value;
        cylinder_value_r = "-" + cylinder_value_r;
        cylinder_value_l = "-" + cylinder_value_l;
        //place values after adding minus
        document.getElementById("_pres_r_cylinder").value = cylinder_value_r;
        document.getElementById("_pres_l_cylinder").value = cylinder_value_l;
        //ranges of left sides cylinder and shuffle them
        var range_text = document.getElementsByClassName("cylinder")[0].innerHTML.split("&nbsp;");
        var min = range_text[4].split("+");
        min = "-" + min[1]
        document.getElementsByClassName("cylinder")[0].innerHTML = min+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text[0];
        //ranges of right side cylinder and shuffle them
        var range_text_left = document.getElementsByClassName("cylinder")[1].innerHTML.split("&nbsp;");
        var min_left = range_text_left[4].split("+");
        min_left = "-" + min_left[1]
        document.getElementsByClassName("cylinder")[1].innerHTML = min_left+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text_left[0];

      }
      else{

        var x = document.getElementById("_pres_r_cylinder").value
        var y = document.getElementById("_pres_l_cylinder").value
        if (x.includes("-") && (y.includes("-"))){
            cylinder_value_r = x.split("-");
            cylinder_value_l = y.split("-");
            cylinder_value_r = x[1];
            cylinder_value_l = y[1];
        }

        document.getElementById("_pres_r_cylinder").value = cylinder_value_r;
        document.getElementById("_pres_l_cylinder").value = cylinder_value_l;
        //ranges left when click on again plus
        var range_right = document.getElementsByClassName("cylinder")[0].innerHTML.split("&nbsp;");

        var max = range_right[0].split("-");
        max = "+"+max[1]
        document.getElementsByClassName("cylinder")[0].innerHTML = range_right[4]+"&nbsp;&nbsp;-&nbsp;&nbsp;"+max;
        //ranges right
        var range_left = document.getElementsByClassName("cylinder")[1].innerHTML.split("&nbsp;");
        var min_left = range_left[0].split("-");
        min_left = "+"+min_left[1]
        document.getElementsByClassName("cylinder")[1].innerHTML = range_left[4]+"&nbsp;&nbsp;-&nbsp;&nbsp;"+min_left;

        document.getElementById("_pres_r_sphere").value = (spahre_inp_r - cylinder_value_r).toFixed(2);
        document.getElementById("_pres_l_sphere").value = (spahre_inp_l - cylinder_value_l).toFixed(2);

        document.getElementById("_pres_r_axis").value = (axis_in_r - 90).toFixed(2);
        document.getElementById("_pres_l_axis").value = (axis_in_l - 90).toFixed(2);

      }

    },
    _handle_filter_ranges: function (ev) {
      var c_name = ev.target.className;
      if (c_name == "button-decrement" || c_name == "button-decrement right" || c_name == "button-decrement left" ){
            var ele = $(ev.target).next();
//          var step = ele.data("step");

          var step =parseFloat($("input[type='radio'][name='dpt']:checked").val());
//          var min = ele.data("min");
//          var max = ele.data("max");
          var max = ele.attr("data-max");
          var min = ele.attr("data-min");
          var value = ele.val();
          if (value == "" || value == "NaN") {
            value = 0;
          } else if (step % 1 === 0) {
            debugger;
            value = parseInt(value);
          } else {
            value = parseFloat(value);
          }

          if (value < min) {
            value = min;
          }
          if (value > max) {
            value = max;
          }

          if (value > min) {
            if ($(ele)[0].id == '_pres_l_axis' || $(ele)[0].id == '_pres_r_axis'){
                step = parseInt(1)
            }
            value = value - step;
            if (value < min) {
              value = min;
            }
            if ($(ele)[0].id != '_pres_l_axis' && $(ele)[0].id != '_pres_r_axis'){
                value = parseFloat(value);
                value = value.toFixed(2);
            }
            $(ele).val(value);
          } else {
            if ($(ele)[0].id != '_pres_l_axis' && $(ele)[0].id != '_pres_r_axis'){
                value = parseFloat(value);
                value = value.toFixed(2);
            }

            
//            value = parseFloat(value);
            $(ele).val(value);
          }
      }
      else if (c_name == "button-increment" || c_name == "button-increment right" || c_name == "button-increment left"){
          var ele = $(ev.target).prev();
//          var step = ele.data("step");
          var step = parseFloat($("input[type='radio'][name='dpt']:checked").val());

//          var max = ele.data("max");
          var max = ele.attr("data-max");
          var min = ele.attr("data-min");
          var parse_float = ele.data("parse_float");
          var value = ele.val();
          if(value == 0){
          }
          if (value == "" || value == "NaN") {
            value = 0;
          }
          if (parse_float == false) {
            value = parseInt(value);
          } else {
            value = parseFloat(value);
          }

          if (value > max) {
            value = max;
          }
          if (value < min) {
            value = min;
              // ************************ if value is greater than 0 and less than 1 e.g 0.75
//              if (value < 1 && value > 0){
//                value = 0;
//              }
              // ******************************************************************************
          }
          if (value < max) {
            if ($(ele)[0].id == '_pres_r_axis' || $(ele)[0].id == '_pres_l_axis'){
                step = parseInt(step) + 1
            }
            value = value + step;
            if (value > max) {
              value = max;
            }
            if ($(ele)[0].id != '_pres_r_axis' && $(ele)[0].id != '_pres_l_axis'){
                value = parseFloat(value);
                value = value.toFixed(2);
            }
            $(ele).val(value);
          } else {
            if ($(ele)[0].id != '_pres_r_axis' && $(ele)[0].id != '_pres_l_axis'){
                value = parseFloat(value);
                value = value.toFixed(2);
            }
            $(ele).val(value);
          }
      }
//      switch (ev.target.className) {
//        case "button-decrement":
//          var ele = $(ev.target).next();
////          var step = ele.data("step");
//
//          var step =parseFloat($("input[type='radio'][name='dpt']:checked").val());
//          var min = ele.data("min");
//          var value = ele.val();
//          if (value == "" || value == "NaN") {
//            value = 0;
//          } else if (step % 1 === 0) {
//            value = parseInt(value);
//          } else {
//            value = parseFloat(value);
//          }
//
//          if (value < min) {
//            value = min;
//            console.log("min");
//          }
//          if (value > max) {
//            value = max;
//            console.log("max");
//          }
//
//          if (value > min) {
//            value = value - step;
//            if (value < min) {
//              value = min;
//            }
//            $(ele).val(value);
//          } else {
//            $(ele).val(value);
//          }
//
//          break;
//        case "button-increment":
//          var ele = $(ev.target).prev();
////          var step = ele.data("step");
//          var step = parseFloat($("input[type='radio'][name='dpt']:checked").val());
//
////          var max = ele.data("max");
//          var max = ele.attr("data-max");
//          var min = ele.attr("data-min");
//          var parse_float = ele.data("parse_float");
//          var value = ele.val();
//          if(value == 0){
//          }
//          if (value == "" || value == "NaN") {
//            value = 0;
//          }
//          if (parse_float == false) {
//            value = parseInt(value);
//          } else {
//            value = parseFloat(value);
//          }
//
//          if (value > max) {
//            value = max;
//          }
//          if (value < min) {
//            value = min;
//          }
//
//          if (value < max) {
//            value = value + step;
//            if (value > max) {
//              value = max;
//            }
//            $(ele).val(value);
//          } else {
//            $(ele).val(value);
//          }
//          break;
//        case "button-increment right":
//          var ele = $(ev.target).prev();
////          var step = ele.data("step");
//          var step = parseFloat($("input[type='radio'][name='dpt']:checked").val());
//
////          var max = ele.data("max");
//          var max = ele.attr("data-max");
//          var min = ele.attr("data-min");
//          var parse_float = ele.data("parse_float");
//          var value = ele.val();
//          if(value == 0){
//          }
//          if (value == "" || value == "NaN") {
//            value = 0;
//          }
//          if (parse_float == false) {
//            value = parseInt(value);
//          } else {
//            value = parseFloat(value);
//          }
//
//          if (value > max) {
//            value = max;
//          }
//          if (value < min) {
//            value = min;
//          }
//
//          if (value < max) {
//            value = value + step;
//            if (value > max) {
//              value = max;
//            }
//            $(ele).val(value);
//          } else {
//            $(ele).val(value);
//          }
//          break;
//
//        case "button-increment left":
//
//          var ele = $(ev.target).prev();
////          var step = ele.data("step");
//          var step = parseFloat($("input[type='radio'][name='dpt']:checked").val());
//
////          var max = ele.data("max");
//          var max = ele.attr("data-max");
//          var min = ele.attr("data-min");
//          var parse_float = ele.data("parse_float");
//          var value = ele.val();
//          if(value == 0){
//          }
//          if (value == "" || value == "NaN") {
//            value = 0;
//          }
//          if (parse_float == false) {
//            value = parseInt(value);
//          } else {
//            value = parseFloat(value);
//          }
//
//          if (value > max) {
//            value = max;
//          }
//          if (value < min) {
//            value = min;
//          }
//
//          if (value < max) {
//            value = value + step;
//            if (value > max) {
//              value = max;
//            }
//            $(ele).val(value);
//          } else {
//            $(ele).val(value);
//          }
//          break;
//        case "button-decrement":
//          var ele = $(ev.target).next();
////          var step = ele.data("step");
//
//          var step =parseFloat($("input[type='radio'][name='dpt']:checked").val());
//          var min = ele.data("min");
//          var value = ele.val();
//          if (value == "" || value == "NaN") {
//            value = 0;
//          } else if (step % 1 === 0) {
//            value = parseInt(value);
//          } else {
//            value = parseFloat(value);
//          }
//
//          if (value < min) {
//            value = min;
//            console.log("min");
//          }
//          if (value > max) {
//            value = max;
//            console.log("max");
//          }
//
//          if (value > min) {
//            value = value - step;
//            if (value < min) {
//              value = min;
//            }
//            $(ele).val(value);
//          } else {
//            $(ele).val(value);
//          }
//
//          break;
//      }
      
      
      
      this._validate_input(ev);
    },
    _convert_into_integer_r: function (ev) {
        var input_value = document.getElementById("_pres_r_axis").value;
        var value = parseInt(input_value);

        document.getElementById("_pres_r_axis").value = value;
    },
    _convert_into_integer_l: function (ev) {
        var input_value = document.getElementById("_pres_l_axis").value;
        var value = parseInt(input_value);

        document.getElementById("_pres_l_axis").value = value;
    },
    _axis_range_incr_left: function (ev) {
        var input_value = document.getElementById("_pres_l_axis").value;
        var value = parseInt(input_value);
        var updated_value = value + 1;

        document.getElementById("_pres_l_axis").value = updated_value;
    },
    _product_coating_data: function (ev) {
        var ele = $(ev.target);
        ele.getAttributes().name
        var name = String(ele.getAttributes().name).split(',')
//        var select_name = document.getElementById("coating_selection_name")
        var coating_value_class = ele.getAttributes().id + "coating_value_name"
        var coating_value = document.getElementById(coating_value_class)

        if (name.length == 1 &&  name[0] == "")
        {
            coating_value.style.display="none";
        }
        else
        {
            coating_value.style.display="block";
        }

        var list_of_all_colour = document.getElementsByClassName("product_coating_radio_date");
        for (var count=0 ; list_of_all_colour.length > count; count++) {
            if (list_of_all_colour[count].id != ele.getAttributes().id)
            {
                if (list_of_all_colour[count].checked == true)
                {

                    list_of_all_colour[count].nextElementSibling.nextElementSibling.nextElementSibling.style.display="none";
                    list_of_all_colour[count].checked = false;
                }
            }
        }
        document.getElementById("color_selection_value")
        Array.from(coating_value).forEach(function(option_element) {
                    option_element.remove();
                });
        for (var count=0 ; name.length > count; count++) {
                var option = document.createElement("option");
                option.text = name[count];
                    option.setAttribute("id", name[count]);
                coating_value.add(option);
            }
            coating_value.setAttribute("price", ele.getAttributes().price)
    },
    _product_color_radio: function (ev) {
        if(ev.target.id){
           $(".row-dt.color-data").hide();
           $(".row-dt.color-data").removeClass("selected-color");

           $("#" + ev.target.id + ".row-dt.color-data").show();
               $("#" + ev.target.id + ".row-dt.color-data").addClass("selected-color");


//           var color_option_id = $('.selected_color').children(":selected").attr("id");
            $('.color-img').hide();
           $(".row-dt.color-data.selected-color div.color_div select.selected_color").prop("selectedIndex", 0);

           var color_option_id = $(".row-dt.color-data.selected-color div.color_div select.selected_color").children(":selected").attr("id");
           color_option_id = parseInt(color_option_id);
           $('#' + color_option_id + '.color-img').show();
        }
        else{
            $(".row-dt.color-data").hide();
            $(".row-dt.color-data").removeClass("selected-color");

        }
    },
    _product_coating_radio: function (ev) {
         
        if(ev.target.id){
//           $(".row-dt.color-data").hide();
//           $("#" + ev.target.id + ".row-dt.color-data").show();
            $(".row-dt.coating-data").show();
            $(".coating-img").hide();
            $("#"+ev.target.id+".coating-img").show();

            $(".rad-design.product_coating_radio").removeClass("selected-coating");
            $("#" + ev.target.id + ".rad-design.product_coating_radio").addClass("selected-coating");

            $('.coating_selection').hide();
            if(ev.target.nextElementSibling.className == 'rad-text flash_mirror_coating'){
                $('.coating_selection').show();
            }

        }
        else{
            $(".row-dt.coating-data").hide();
            $(".rad-design.product_coating_radio").removeClass("selected-coating");
        }
    },
    _axis_range_decr_left: function (ev) {
        var input_value = document.getElementById("_pres_l_axis").value;
        var value = parseInt(input_value);
        var updated_value = value - 1;
        if (updated_value<0){
            updated_value = 0;
        }
        document.getElementById("_pres_l_axis").value = updated_value;
    },
    _axis_range_incr_right: function (ev) {
        var input_value = document.getElementById("_pres_r_axis").value;
        var value = parseInt(input_value);
        var updated_value = value + 1;
//        if (updated_value<0){
//            updated_value = 0;
//        }
        document.getElementById("_pres_r_axis").value = updated_value;
    },
    _axis_range_decr_right: function (ev) {
        var input_value = document.getElementById("_pres_r_axis").value;
        var value = parseInt(input_value);
        var updated_value = value - 1;
//        if (updated_value>180){
//            updated_value = 180;
//        }
        if (updated_value<0){
            updated_value = 0;
        }
        document.getElementById("_pres_r_axis").value = updated_value;
    },
    _handle_category_filter: function (ev) {
      if(ev.currentTarget.nextElementSibling){
          $("ul.nav.nav-pills.flex-column.nav-hierarchy").hide();
            $(ev.currentTarget).closest('ul').show();
            $(ev.currentTarget.nextElementSibling).show();
      }

      this.product_category = $(ev.target).data("id");
      debugger;
      this._handle_filter();
    },
    _set_prescription_range: function (
      ele_id,
      min,
      max,
      default_value = 0,
      parse_float = true
    ) {

      var min_text = "";
      var max_text = "";
      if (parse_float == true) {
        min = min.toFixed(2);
        max = max.toFixed(2);
        default_value = default_value.toFixed(2);
      }

      ele_id = "#" + ele_id;
      $(ele_id).attr("data-max", max);
      $(ele_id).attr("data-min", min);
      $(ele_id).attr("data-parse_float", true);
      if ($(ele_id).val() == ""){
         $(ele_id).val(default_value);
      }
//      $(ele_id).val(default_value);
//
//      min_text = min > 0 ? "+" + min : min;
//      max_text = max > 0 ? "+" + max : max;
        
      if (ele_id == '#_pres_r_addition' || ele_id == "#_pres_l_addition"){
            if(min < 0 || min == 0){
                document.getElementById('_pres_l_addition').readOnly = true;
                document.getElementById('_pres_r_addition').readOnly = true;
                min = 0;
                max = 0;
            }
            else{
                document.getElementById('_pres_l_addition').readOnly = false;
                document.getElementById('_pres_r_addition').readOnly = false;
            }
      }
      if(ele_id == '#_pres_l_base1' || ele_id == "#_pres_l_base2" || ele_id == "#_pres_r_base1" || ele_id == "#_pres_r_base2"){
        min_text = min+"°";
        max_text = max+"°";
      }
      else{
           min_text = min > 0 ? "+" + min : min;
           max_text = max > 0 ? "+" + max : max;
      }
      $(ele_id)
        .closest(".incr-decr-control-wrap")
        .find("span.range_text")
        .html(min_text + "&nbsp;&nbsp;-&nbsp;&nbsp;" + max_text);

      if(ele_id == '#_pres_r_cylinder'){
        $('#diameter_max_range_right').html(max_text);
      }
      if(ele_id == "#_pres_l_cylinder"){
        $('#diameter_max_range_left').html(max_text);
      }
        
        
        
        
    },
    _set_diameter_options: function (options) {
      options = JSON.parse(atob(options));
      console.clear();
      console.log(options);

      var l_option_html = "";
      var r_option_html = "";
      options.forEach((o) => {
        console.log(o);
        l_option_html =
          l_option_html +


          ' <ul class="selection_cls"><li> <label class="check-container radio"> <input type="radio" class="left_lens_diameter" name="left_diameter" value=' +'"'+
          o.id +'"'+ 'id=' +'"'+ o.id +'"' +
          '/> <span class="indicator"></span> </label><span>' +
          o.name + '</span></li></ul>';


        r_option_html =
          r_option_html +

          ' <ul class="selection_cls"><li> <label class="check-container radio"> <input type="radio" class="right_lens_diameter" id="right_lens_diameter" name="right_diameter"  value=' +
          o.id +
          '/> <span class="indicator"></span> </label><span>' +
          o.name + '</span></li></ul>';
      });

      $("#left_lens_diameter_container").html(l_option_html);
      $("#right_lens_diameter_container").html(r_option_html);
    },
    _handle_search_lenses: function (ev) {
      $(".oe_website_sale").show();
      $(".oe_presecription_form").hide();
    },
    _show_prescription: function (ev) {
      var ele = $(ev.target);
      var pr_config = ele.data();
      var product_price = pr_config["price"]
      $("#product_price").val(product_price);
      // set product_name name
          var product_name = ele[0].innerText;
          $('.product_name').text(product_name);
          var product_id = $(ele[0]).attr('data-id');
          $('.product_info_span').attr('id',product_id);
      // *****************************************
      // set filtered data on product
         this._set_filtered_data()
      // *****************************************
      // Show Individual Parameter link on Prescription Page
        if (pr_config["individual_parameter_configurable"]){
            $(".ind").show();
            this._set_individual_parameters(pr_config)
            $("#prescription_continue").hide();
            $("#individual_parameters_continue").show();
            $("#nextbutton-prescription").show();
            $("#nextbutton-prescription").attr("href", "#individual_page");
            $("#nextbutton-sidebar2").attr("href", "#backperscription");
        }
        else{
        }
      // *****************************************
      // Show Color link on Prescription Page
        if (pr_config["is_color"]){
            $(".colo").show();
            $("#prescription_continue").hide();
            $("#individual_parameters_continue").hide();
            $("#color_continue").show();
            if (pr_config["individual_parameter_configurable"]){
                $("#nextbutton-individual").show();
                $("#nextbutton-individual").attr("href", "#color_page");

                $("#nextbutton-sidebar4").attr("href", "#backindividual");
                $("#color_back_button_link").attr("href", "#backindividual");
            }
            else{
                $("#nextbutton-prescription").show();
                $("#nextbutton-prescription").attr("href", "#color_page");

                $("#nextbutton-sidebar4").attr("href", "#backperscription");
                $("#color_back_button_link").attr("href", "#backperscription");
            }
        }
      // *****************************************
      // Show Coating link on Prescription Page
        if (pr_config["is_coating"]){
            $(".coa").show();
            $("#prescription_continue").hide();
            $("#individual_parameters_continue").hide();
            $("#color_continue").hide();
            $("#coating_continue").show();
            if(pr_config["is_color"]){
                $("#nextbutton-color").show();
                $("#nextbutton-color").attr("href", "#coating_page");

                $("#coating_back_button").attr("href", "#backcolor");
                $("#coating_back_button_link").attr("href", "#backcolor");
            }
            else{
                $("#nextbutton-individual").show();
                $("#nextbutton-individual").attr("href", "#coating_page");

                $("#coating_back_button").attr("href", "#backindividual");
                $("#coating_back_button_link").attr("href", "#backindividual");
            }
        }
      // *****************************************
      // Show RLF
        if (pr_config["is_rlf"]){
            $(".rlf").show();
        }
      // **************************************
      // Show Dpt 0.01
        if (pr_config["is_dpt_two"]){
            $("#dpt_two").show();
        }
      // **************************************
      // Show
        if (pr_config["is_cod"]){
            $(".cod").show();
        }
      // **********************************
      $('#get_product_name').val(pr_config.name)
      $('#get_product_id').val(pr_config.id)
      console.log(pr_config);
      $(".oe_website_sale").hide();
      $(".oe_presecription_form").show();
      $("#choose_product").attr("data-pr_url", pr_config.url);
      this._set_prescription_range(
        "_pres_l_sphere",
        pr_config.sphere_range_min,
        pr_config.sphere_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_l_cylinder",
        pr_config.cylinder_range_min,
        pr_config.cylinder_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_l_axis",
        0,
        180,
        0,
        false
      );
      this._set_prescription_range(
        "_pres_l_addition",
        pr_config.additional_range_min,
        pr_config.additional_range_max,
        0
      );

      this._set_prescription_range(
        "_pres_l_prism1",
        pr_config.prism1_range_min,
        pr_config.prism1_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_l_prism2",
        pr_config.prism1_range_min,
        pr_config.prism1_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_l_base1",
        pr_config.base1_range_min= 0,
        pr_config.base1_range_max= 360,
        0,
        false
      );
      this._set_prescription_range(
        "_pres_l_base2",
        pr_config.base2_range_min=0,
        pr_config.base2_range_max=360,
        0,
        false
      );

      this._set_prescription_range(
        "_pres_r_sphere",
        pr_config.sphere_range_min,
        pr_config.sphere_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_r_cylinder",
        pr_config.cylinder_range_min,
        pr_config.cylinder_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_r_axis",
        pr_config.axis_range_min,
        pr_config.axis_range_max,
        0,
        false
      );
      this._set_prescription_range(
        "_pres_r_addition",
        pr_config.additional_range_min,
        pr_config.additional_range_max,
        0
      );

      this._set_prescription_range(
        "_pres_r_prism1",
        pr_config.prism1_range_min,
        pr_config.prism1_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_r_prism2",
        pr_config.prism1_range_min,
        pr_config.prism1_range_max,
        0
      );
      this._set_prescription_range(
        "_pres_r_base1",
        pr_config.base1_range_min= 0,
        pr_config.base1_range_max=360,
        0,
        false
      );
      this._set_prescription_range(
        "_pres_r_base2",
        pr_config.base2_range_min=0,
        pr_config.base2_range_max=360,
        0,
        false
      );
      this._set_diameter_options(pr_config.diameter_option);
       $("input:radio[name=right_diameter]:first");
       $("input:radio[name=left_diameter]:first");

      this._rpc({
        route: "/find_product_colour",
        params: {
          product_id: parseInt(pr_config.id),
        },}).then(function (data) {
            xml_load.then(function(){
                var colour_table = $("#product_colour_selection_table");
                var coating_table = $("#product_coating_table");
                if (data){
                    if (data.color_data){
                        var row_for_color = QWeb.render('color', { color_data : data.color_data} );
                        colour_table.append(row_for_color);
                    }
                    if (data.coating_data){
                        var row_for_coating = QWeb.render('coating', { coating_data : data.coating_data} );
                        coating_table.append(row_for_coating);
                    }
                }
            });

        });
    },
    _set_filtered_data(){
        var r_sphere = $("#r_sphere").val();
        var r_cylinder = $("#r_cylinder").val();
        var r_axis = $("#r_axis").val();
        var r_addition = $("#r_addition").val();

        var l_sphere = $("#l_sphere").val();
        var l_cylinder = $("#l_cylinder").val();
        var l_axis = $("#l_axis").val();
        var l_addition = $("#l_addition").val();

        if (r_sphere){
            $("#_pres_r_sphere").val(r_sphere);
        }
        if (r_cylinder){
            $("#_pres_r_cylinder").val(r_cylinder);
        }
        if (r_axis){
            $("#_pres_r_axis").val(r_axis);
        }
        if (r_addition){
            $("#_pres_r_addition").val(r_addition);
        }

        if (l_sphere){
            $("#_pres_l_sphere").val(l_sphere);
        }
        if (l_cylinder){
            $("#_pres_l_cylinder").val(l_cylinder);
        }
        if (l_axis){
            $("#_pres_l_axis").val(l_axis);
        }
        if (l_addition){
            $("#_pres_l_addition").val(l_addition);
        }
    },
    _set_individual_parameters(pr_config){
        // Show Right Pupil distance on Individual Page
        if (pr_config["is_rpd"]){
            $("#pupil_distance").show();
            $("#rpd").show();
            var rpd_min = pr_config["rpd_min"]
            var rpd_max = pr_config["rpd_max"]
            var right_distance = rpd_min + " mm " + "–"+ " "+ rpd_max + " mm"
            $("#right_pupil_distance").text(right_distance);

            var standard = pr_config["rpd_std"]
            $("#right_pupil_distance_standard").text(standard);
            //***** set min and max attribute of pd_right_field input field
            $("#pd_right_field").attr({"max" : rpd_max,"min" : rpd_min});
        }
      // *****************************************
      // Show Left Pupil distance on Individual Page
      if (pr_config["is_lpd"]){
        $("#pupil_distance").show();
        $("#lpd").show();
        var lpd_min = pr_config["lpd_min"]
        var lpd_max = pr_config["lpd_max"]
        var left_distance = lpd_min + " mm " + "–"+ " "+ lpd_max + " mm"
        $("#left_pupil_distance").text(left_distance);

        var standard = pr_config["lpd_std"]
        $("#left_pupil_distance_standard").text(standard);
        //***** set min and max attribute of pd_left_field input field
            $("#pd_left_field").attr({"max" : lpd_max,"min" : lpd_min});
      }
      // *****************************************
      // Show Back vertex distance (BVD) on Individual Page
      if (pr_config["is_bvd"]){
        $("#bvd_section").show();
        var bvd_min = pr_config["bvd_min"]
        var bvd_max = pr_config["bvd_max"]
        var back_vertex_distance = bvd_min + " mm " + "–"+ " "+ bvd_max + " mm"
        $("#bvd").text(back_vertex_distance);

        var standard = pr_config["bvd_std"]
        $("#bvd_standard").text(standard);
        //***** set min and max attribute of hsa_right_field input field
            $("#hsa_right_field").attr({"max" : bvd_max,"min" : bvd_min});
      }
      // *****************************************
      // Show Pantoscopic angle (PantA) on Individual Page
      if (pr_config["is_pant_a"]){
        
        $("#pa_section").show();
        var panta_min = pr_config["panta_min"]
        var panta_max = pr_config["panta_max"]
        var pant_a_distance = "-" + panta_min + " ° " + "–"+ " "+ panta_max + " °"
        $("#pant_a").text(pant_a_distance);

        var standard = pr_config["panta_std"]
        $("#panta_standard").text(standard);
        //***** set min and max attribute of vorneigung_field input field
            $("#vorneigung_field").attr({"max" : panta_max,"min" : panta_min});
      }
      // *****************************************
      // Show Bow angle (BA) on Individual Page
      if (pr_config["is_ba"]){
        $("#ba_section").show();
        var ba_min = pr_config["ba_min"]
        var ba_max = pr_config["ba_max"]
        var ba_distance = "-" + ba_min + " ° " + "–"+ " "+ ba_max + " °"
        $("#ba").text(ba_distance);

        var standard = pr_config["ba_std"]
        $("#ba_standard").text(standard);
        //***** set min and max attribute of scheibenwinkel_field input field
            $("#scheibenwinkel_field").attr({"max" : ba_max,"min" : ba_min});
      }
      // *****************************************
      // Show Near object distance (NOD) on Individual Page
      if (pr_config["is_nod"]){
        $("#nod_section").show();
        var nod_min = pr_config["nod_min"]
        var nod_max = pr_config["nod_max"]
        var nod_distance = nod_min + " mm " + "–"+ " "+ nod_max + " mm"
        $("#nod").text(nod_distance);

        var standard = pr_config["nod_std"]
        $("#nod_standard").text(standard);
        //***** set min and max attribute of distance_field input field
            $("#distance_field").attr({"max" : nod_max,"min" : nod_min});
      }
      // *****************************************
      // Show Inset
          if (pr_config["is_inset"]){
            $("#inset").show();
          }
      // ******************************************
      // Show Progression Length on Individual Page
      if (pr_config["is_progression_length"]){
        $("#pl_section").show();
        var progression_data = this._rpc({
            model: 'product.template',
            method: 'get_progression_length',
            args: [1, pr_config['id']],
        }).then(function (result){
            
            for (let i = 0; i < result.length; i++){
                $('#fittingheight_select').append($('<option id=' + result[i].id +'>'+result[i].name +'</option>'));
                $('#fittingheight_select').show();
            }
        });
      // *******************************************************
//        $("#fittingheight_select").show();
      }
    },
    _select_lens_side: function () {
      var lens_side = $("input[name='lens_side']:checked").val();
      switch (lens_side) {
        case "left":
          $(".right_lens_side").hide();
          $(".btn-left-right").hide();
          $(".left_lens_side").show();
          $(".seperator").hide();
          break;
        case "right":
          $(".right_lens_side").show();
          $(".btn-left-right").hide();
          $(".left_lens_side").hide();
          $(".seperator").hide();
          break;
        default:
          $(".right_lens_side").show();
          $(".left_lens_side").show();
          $(".btn-left-right").show();
          $(".seperator").show();
          break;
      }
    },
    _handle_prism: function (ev) {
      var $input = $(ev.currentTarget);
      switch ($input.attr("id")) {
        case "_pres_l_prism":
          if ($input.is(":checked") == true) {
            $(".l_prism_attr").show();
          } else {
            $(".l_prism_attr").hide();
          }
          break;
        case "_pres_r_prism":
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
    _handle_choose_product: function (ev) {

      var lens_side = $("input[name='lens_side']:checked").val();
      var reference_number = $( "input[type=text][name=reference_number]").val();
      var product_price = $("#product_price").val();
      var product_id = $('#get_product_id').val();
//      var color_id = $(".selected-color").find('select').children(":selected").attr("id");
      var color_id = $(".row-dt.color-data.selected-color div.color_div select.selected_color").children(":selected").attr("id");
        var coating_id = $(".selected-coating").attr("id");
        var coating_name = $("#"+coating_id+".coating_name").html();
        if (coating_name){
            if (coating_name.includes("Optiplas O+") && lens_side != 'both'){
                $("#optiplasModel").modal("show");
                return;
            }
            else if(coating_name.includes("Optiplas Blue-CX UV")){
                var color_name = $(".selected-color").find('select').children(":selected").text();
                var col_intensity = parseInt(color_name.replace(/[^0-9.]/g, "").substring(0, 2));
                if(col_intensity < 50){
                    $("#optiplas_blue_cx_Model").modal("show");
                    return;
                }
    //            var id_number = color_name.replace(/[^0-9.]/g, "");
            }
        }
        if($("#"+coating_id+".coating_price").html()){
          var coating_price = $("#"+coating_id+".coating_price").html().trim().split(" ")[0];

          coating_price = parseFloat(coating_price);
        }
      if(color_id){
        var color_price = $(".color_price").html().trim().split(" ")[0];

        color_price = parseFloat(color_price);
      }
      this._validate_individual_parameters();
      var color_line_id = '';
      var color_value = $('#color_selection_value').val();
      var color_name = $('.color_option').val();
      var color_line_id = $('.color_option').getAttributes().id;
      
      var coating_name = '';
      var coating_line_id = '';
      var selected_coating = $("input[class='product_coating_radio_date']:checked");
//      if (selected_coating.getAttributes().id)
//        {
//            coating_line_id = selected_coating.getAttributes().id;
//            coating_name = selected_coating[0].nextElementSibling.nextElementSibling.nextElementSibling.value;
//            coating_price = 0;
//
//        }


      var lens_side = $("input[name='lens_side']:checked").val();
      var o_line_id = $(".oe_presecription_form").data("line_id");

      var l_sphere = $("#_pres_l_sphere").val();
      var l_cylinder = $("#_pres_l_cylinder").val();
      var l_axis = $("#_pres_l_axis").val();
      var l_addition = $("#_pres_l_addition").val();
      var l_prism1 = $("#_pres_l_prism1").val();
      var l_prism2 = $("#_pres_l_prism2").val();
      var l_base1 = $("#_pres_l_base1").val();
      var l_base2 = $("#_pres_l_base2").val();
      var left_lens_diameter = $("input[name='left_diameter']:checked").val();
      var r_sphere = $("#_pres_r_sphere").val();
      var r_cylinder = $("#_pres_r_cylinder").val();
      var r_axis = $("#_pres_r_axis").val();
      var r_addition = $("#_pres_r_addition").val();
      var r_prism1 = $("#_pres_r_prism1").val();
      var r_prism2 = $("#_pres_r_prism2").val();
      var r_base1 = $("#_pres_r_base1").val();
      var r_base2 = $("#_pres_r_base2").val();
      var right_lens_diameter = $("input[name='right_diameter']:checked").val();

      // ***************** if UV Filter Selected **********************************
        var uv_filter = $("input[name='uv_filter']:checked").val();
        if (uv_filter){
            uv_filter = true;
            var uv_filter_id = $('.uv_filter_radio').attr('id');
            var uv_price = parseFloat($("#uv_price").text());
        }
      //***************************************************************************
      // ***************** if Flash Mirror Coating Selected **********************************
//        if ($(".flash_select").attr("selectedIndex") > 0){
//          $(".flash_select").is(':selected')
        if ($('#flash_mirror_coating').is(':checked')){
            coating_id = 0;
            var flash_mirror_coating = $(".flash_select").children("option:selected").attr("id");
//            var flash_mirror_coating = $(".row-dt.coating_selection div select.flash_select").children("option:selected").attr("id");
            if (flash_mirror_coating){
                flash_mirror_coating = parseInt(flash_mirror_coating)
                var flash_mirror_coating_price = parseFloat($(".flash_mirror_coating_price").text());
            }
        }
      //***************************************************************************
      // ***************** Individual Parameters
      var r_pd = $("#pd_right_field").val()
      var l_pd = $("#pd_left_field").val()
      var bvd = $("#hsa_right_field").val()
      var pant_a = $("#vorneigung_field").val()
      var ba = $("#scheibenwinkel_field").val()
      var nod = $("#distance_field").val()
      var pg_height = $('#fittingheight_select').find(":selected").attr("id");
      var right_inset = "";
      var left_inset = "";
      // *******************************************
      var cod_near = false;
      var cod_balance = false;
      var cod_far = false;
      var rlf_one = 0;
      var rlf_two = 0;
      var rlf_three = 0;
      var rlf_four = 0;
      // ************ COD *************************
        if($("#cod_near:checked").val()){
            cod_near = true;
        }
        if($("#cod_balance:checked").val()){
            cod_balance = true;
        }
        if($("#cod_far:checked").val()){
            cod_far = true;
        }
      // ******************************************
     // ************ RLF **************************
     if($("#rlf_one:checked").val()){
            rlf_one = 0.37;
     }
     if($("#rlf_two:checked").val()){
            rlf_two = 0.62;
     }
     if($("#rlf_three:checked").val()){
            rlf_three = 0.87;
     }
     if($("#rlf_four:checked").val()){
            rlf_four = 1.12;
     }
     // *******************************************
     // ***************** if Inset Selected **********************************
        if ($("#inset").css("display") == "block"){
            //********************* Right Inset ****************************
            right_inset = $(".right_inset").children("option:selected").attr("value");
            //********************* Left Inset ***************************
            left_inset = $(".left_inset").children("option:selected").attr("value");
        }
     // ***************************************************************************
      var radio_value = $( "input[type=radio][name=lens_side]:checked" ).val();
      if(radio_value == "right"){
//            if((r_sphere =="") || (r_sphere =="0.00")){
            if(r_sphere ==""){
                document.getElementById("continue_alert").innerHTML = "Sphere fields are required fields";
                alert("Some Fields are missing in flow");
                return
            }
      }
      else if(radio_value == "left"){
//            if(l_sphere =="" || l_sphere =="0.00"){
            if(l_sphere ==""){
                document.getElementById("continue_alert").innerHTML = "Sphere fields are required fields";
                alert("Some Fields are missing in flow");
                return
            }
      }
      else if(radio_value == "both"){
//            if((l_sphere =="" || r_sphere =="") || (l_sphere =="0.00" || r_sphere =="0.00")){
            if((l_sphere =="" || r_sphere =="")){
                document.getElementById("continue_alert").innerHTML = "Sphere fields are required fields";
                alert("Some Fields are missing in flow");
                return
            }
      }
      if (!$("input[name=reference_number]").val()) {
            $("input[name=reference_number]").css("border", "2px solid red");
            $("input[name=reference_number]").css("border-radius", "4px");
            $("#reference_number_text").show();
            return
//            $("#individual_page").hide();
//            $("#prescription_page").show();
      }
      else if ( ev.target.id == "nextbutton-sidebar1") {

        $(".ind").addClass("active");
        $(".pres").addClass("done");
        $(".colo").addClass("done");
        $(".coa").addClass("done");
        $(".pres").removeClass("active");
        $(".colo").removeClass("active");
        $(".coa").removeClass("active");
        document.getElementById("individual_page").style.display="block";
        document.getElementById("color_page").style.display="none";
        document.getElementById("prescription_page").style.display="none";
        document.getElementById("coating_page").style.display="none";
        document.getElementById("continue_alert").innerHTML = "";
      }

      var data = {
        reference_number: reference_number,
        product_id: product_id,
        product_price: product_price,
        color_id: color_id,
        coating_id: coating_id,
        color_value: color_value,
        color_price: parseFloat(color_price),
        color_line_id: color_line_id,
        coating_line_id: coating_line_id,
        coating_name: coating_name,
        coating_price: parseFloat(coating_price),
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
        r_pd: r_pd,
        l_pd: l_pd,
        bvd: bvd,
        pant_a: pant_a,
        ba: ba,
        nod: nod,
        pg_height: pg_height,
        cod_near: cod_near,
        cod_balance: cod_balance,
        cod_far: cod_far,
        rlf_one: rlf_one,
        rlf_two: rlf_two,
        rlf_three: rlf_three,
        rlf_four: rlf_four,
        uv_filter: uv_filter,
        uv_filter_id: uv_filter_id,
        uv_price: uv_price,
        flash_mirror_coating: flash_mirror_coating,
        flash_mirror_coating_price: flash_mirror_coating_price,
        right_inset: right_inset,
        left_inset: left_inset,
      };

      if(ev.target.id == "choose_product" ){
        this._rpc({
            route: "/shop/cart/update",
            params: data}).then(function(res){
            var redirect_url = window.location.origin + "/shop/cart";
            window.location.replace(redirect_url);
        });

      }


    },
    _set_left_prism :function(){



    },
    _set_left_right: function(ev){
        if ($(".incr-decr-control").hasClass("_err")){
            return;
        }
        if($('#right_lens_diameter:checked').val()){
            var rd_id = $('#right_lens_diameter:checked').val();
            rd_id = rd_id.split("/");
            rd_id = rd_id[0];
            $("#"+rd_id).attr('checked', 'checked');
        }

       var r_prism_checkbox = $('#_pres_r_prism').prop('checked');
       if (r_prism_checkbox){
            $('#_pres_l_prism').attr('checked', true);
            $(".l_prism_attr").show();
       }

       var pres_r_sphere = $('#_pres_r_sphere');
       var pres_l_sphere = $('#_pres_l_sphere');
       pres_l_sphere.val(pres_r_sphere.val());

       var pres_r_axis = $('#_pres_r_axis');
       var pres_l_axis = $('#_pres_l_axis');
       pres_l_axis.val(pres_r_axis.val());

       var pres_r_cylinder = $('#_pres_r_cylinder');
       var pres_l_cylinder = $('#_pres_l_cylinder');
       pres_l_cylinder.val(pres_r_cylinder.val());

       var pres_r_addition = $('#_pres_r_addition');
       var pres_l_addition = $('#_pres_l_addition');
       pres_l_addition.val(pres_r_addition.val());

       var _pres_r_prism1 = $('#_pres_r_prism1');
       var _pres_l_prism1 = $('#_pres_l_prism1');
       _pres_l_prism1.val(_pres_r_prism1.val());

       var _pres_r_prism2 = $('#_pres_r_prism2');
       var _pres_l_prism2 = $('#_pres_l_prism2');
       _pres_l_prism2.val(_pres_r_prism2.val());


        var pres_r_base1 =  $('#_pres_r_base1');
        var pres_l_base1 =  $('#_pres_l_base1');
        pres_l_base1.val(pres_r_base1.val());


        var pres_r_base2 =  $('#_pres_r_base2');
        var pres_l_base2 =  $('#_pres_l_base2');
        pres_l_base2.val(pres_r_base2.val());

        var r_pupil_distance =  $('#r_pupil_distance');
        var l_pupil_distance =  $('#l_pupil_distance');
        l_pupil_distance.val(r_pupil_distance.val());

        var progression_lenght =  $('#progression_lenght');
        var l_progression_length =  $('#l_progression_length');
        l_progression_length.val(progression_lenght.val());

        var self = this;
        this._rpc({ route: "/get_diameter",
         params: { id : parseInt(rd_id) }, }).then(function(data){

            self._set_prescription_range("_pres_l_cylinder",data.cylinder_range_min, data.cylinder_range_max, 0);
            self._set_prescription_range("_pres_l_sphere",data.sphere_range_min, data.sphere_range_max, 0);
            self._set_prescription_range("_pres_l_addition",data.additional_range_min, data.additional_range_max, 0);
            self._set_prescription_range("_pres_l_prism1",data.prism_range_min, data.prism_range_max, 0);
            self._set_prescription_range("_pres_l_prism2",data.prism_range_min, data.prism_range_max, 0);

         });
    },
    _show_modal: function(e){
         rpc.query({
            model: 'product.template',
//            method: 'read',
            method: 'get_coating_desc',
            args: [parseInt(e.currentTarget.id)],
         }).then(function (res) {
            var html_data = res.coating_desc;
            var $infoModel = $("#infoModel");
            $("#modal_product_name").text(res.name)
            $(".modal-body").empty();
            $infoModel.find("div[class='modal-body']").append(html_data);
            $infoModel.modal("show");
        });

    },
    _show_product_info_modal: function(e){
        rpc.query({
            model: 'product.template',
//            method: 'read',
            method: 'get_product_info',
            args: [parseInt(e.currentTarget.id)],
         }).then(function (res) {
            var html_data = res.product_info;
            var product_info_modal = $("#product_info_modal");
            $("#modal_product_info").text(res.name);
            $(".product_info_modal_desc").empty();
            $(".product_info_modal_desc").append(html_data);
            product_info_modal.modal("show");
        });
    },
    _show_color_img: function(e){
        $(".color-img").hide();
        var option_id = $(e.currentTarget).find(":selected")[0].id;
        $("#" + option_id + ".color-img").show();
    },
    _validate_input_field: function(e){
        if (!$("input[name=reference_number]").val()) {
            $("input[name=reference_number]").css("border", "2px solid red");
            $("input[name=reference_number]").css("border-radius", "4px");
            $("#reference_number_text").show();
            $("#individual_page").hide();

            $("#prescription_page").show();
        }
        else{
            $("input[name=reference_number]").css("border", "black");
            $("input[name=reference_number]").css("border-radius", "1px");
            $("#reference_number_text").hide();
        }
        if ($('.ind').css('display') == 'list-item'){
            if (($('#rpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('colo')) || ($('#rpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('coa')) || ($('#rpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('ind')) ){
                if (!$("#pd_right_field").val()){
                    $("#pd_right_field").css("border", "2px solid red");
                    $("#pd_right_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#pd_right_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#pd_right_field").css("border", "black");
                    $("#pd_right_field").css("border-radius", "1px");
                }
            }
            if (($('#lpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('colo')) || ($('#lpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('coa')) || ($('#lpd').css('display') == 'table-row' && $(e.currentTarget).hasClass('ind'))){
                if (!$("#pd_left_field").val()){
                    $("#pd_left_field").css("border", "2px solid red");
                    $("#pd_left_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#pd_left_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#pd_left_field").css("border", "black");
                    $("#pd_left_field").css("border-radius", "1px");
                }
            }
            if (($('#bvd_section').css('display') == 'block' && $(e.currentTarget).hasClass('colo')) || ($('#bvd_section').css('display') == 'block' && $(e.currentTarget).hasClass('coa')) || ($('#bvd_section').css('display') == 'block' && $(e.currentTarget).hasClass('ind'))){
                if (!$("#hsa_right_field").val()){
                    $("#hsa_right_field").css("border", "2px solid red");
                    $("#hsa_right_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#hsa_right_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#hsa_right_field").css("border", "black");
                    $("#hsa_right_field").css("border-radius", "1px");
                }
            }
            if (($('#pa_section').css('display') == 'block' && $(e.currentTarget).hasClass('colo')) || ($('#pa_section').css('display') == 'block' && $(e.currentTarget).hasClass('coa')) || ($('#pa_section').css('display') == 'block' && $(e.currentTarget).hasClass('ind'))){
                if (!$("#vorneigung_field").val()){
                    $("#vorneigung_field").css("border", "2px solid red");
                    $("#vorneigung_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#vorneigung_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#vorneigung_field").css("border", "black");
                    $("#vorneigung_field").css("border-radius", "1px");
                }
            }
            if (($('#ba_section').css('display') == 'block' && $(e.currentTarget).hasClass('colo')) || ($('#ba_section').css('display') == 'block' && $(e.currentTarget).hasClass('coa')) || ($('#ba_section').css('display') == 'block' && $(e.currentTarget).hasClass('ind'))){
                if (!$("#scheibenwinkel_field").val()){
                    $("#scheibenwinkel_field").css("border", "2px solid red");
                    $("#scheibenwinkel_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#scheibenwinkel_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#scheibenwinkel_field").css("border", "black");
                    $("#scheibenwinkel_field").css("border-radius", "1px");
                }
            }
            if (($('#nod_section').css('display') == 'block' && $(e.currentTarget).hasClass('colo')) || ($('#nod_section').css('display') == 'block' && $(e.currentTarget).hasClass('coa')) || ($('#nod_section').css('display') == 'block' && $(e.currentTarget).hasClass('ind'))){
                if (!$("#distance_field").val()){
                    $("#distance_field").css("border", "2px solid red");
                    $("#distance_field").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else if($("#distance_field").hasClass('_err')){
                    this._show_individual_page()
                }
                else{
                    $("#distance_field").css("border", "black");
                    $("#distance_field").css("border-radius", "1px");
                }
            }
            if (($('#pl_section').css('display') == 'block' && $(e.currentTarget).hasClass('colo')) || ($('#pl_section').css('display') == 'block' && $(e.currentTarget).hasClass('coa')) || ($('#pl_section').css('display') == 'block' && $(e.currentTarget).hasClass('ind'))){
                if ($('#fittingheight_select').children("option:selected").val() == '0'){
//                    $("#fittingheight_select").css("border", "2px solid red");
//                    $("#fittingheight_select").css("border-radius", "4px");
                    if (($('.colo').css('display') == 'list-item') || ($('.coa').css('display') == 'list-item')){
                        $("#color_page").hide();
                        $("#coating_page").hide();
                    }
                    $("#individual_page").show();
                }
                else{
                    $("#fittingheight_select").css("border", "black");
                    $("#fittingheight_select").css("border-radius", "1px");
                }
            }


        }
//        if ($("input[name='lens_side']:checked").val() == 'both'){
//            if ($("#_pres_r_sphere").val() == '0.00') {
//                $("#_pres_r_sphere").closest(".incr-decr-control").addClass("_err");
////                $("#_pres_r_sphere").css("border", "2px solid red");
////                $("#_pres_r_sphere").css("border-radius", "4px");
//
//                $("#individual_page").hide();
//                $("#color_page").hide();
//                $("#coating").hide();
//                $("#prescription_page").show();
//            }
//            else{
//                $("#_pres_r_sphere").closest(".incr-decr-control").removeClass("_err");
//            }
//            if ($("#_pres_l_sphere").val() == '0.00'){
//                $("#_pres_l_sphere").closest(".incr-decr-control").addClass("_err");
//
//                $("#individual_page").hide();
//                $("#color_page").hide();
//                $("#coating").hide();
//                $("#prescription_page").show();
//            }
//            else{
//                $("#_pres_l_sphere").closest(".incr-decr-control").removeClass("_err");
//            }
//        }

    },
    _check_reference_number: function(){
        $("input[name=reference_number]").css("border", "2px solid black");
        $("input[name=reference_number]").css("border-radius", "2px");
        $("#reference_number_text").hide();
    },
    _convert_num_into_float: function(ev){
        if ($( "#_pres_r_sphere").val()){
            var num = $("#_pres_r_sphere").val();
//            var num = parseFloat($("#_pres_r_sphere").val())
//            num = num.toString()

//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_r_sphere").val(num);
        }
        if ($( "#_pres_r_cylinder").val()){
            var num = $("#_pres_r_cylinder").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_r_cylinder").val(num)
        }
        if ($( "#_pres_r_addition").val()){
            var num = $("#_pres_r_addition").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_r_addition").val(num)
        }
        if ($( "#_pres_r_prism1").val()){
            var num = $("#_pres_r_prism1").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_r_prism1").val(num)
        }
        if ($( "#_pres_r_prism2").val()){
            var num = $("#_pres_r_prism2").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_r_prism2").val(num)
        }
        if ($( "#_pres_l_sphere").val()){
            var num = $("#_pres_l_sphere").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_l_sphere").val(num)
        }
        if ($( "#_pres_l_cylinder").val()){
            var num = $("#_pres_l_cylinder").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_l_cylinder").val(num)
        }
        if ($( "#_pres_l_addition").val()){
            var num = $("#_pres_l_addition").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_l_addition").val(num)
        }
        if ($( "#_pres_l_prism1").val()){
            var num = $("#_pres_l_prism1").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_l_prism1").val(num)
        }
        if ($( "#_pres_l_prism2").val()){
            var num = $("#_pres_l_prism2").val()
//            if (num.indexOf('.') > 2){
//                num = num.substring(0, 2);
//            }
//            else if (!(num.includes('.'))  && num.length > 2){
//                num = num.substring(0, 2);
//            }
            num = parseFloat(num);
            num = num.toFixed(2);
            $("#_pres_l_prism2").val(num)
        }
        if ($( "#r_sphere").val()){
            var num = parseFloat($("#r_sphere").val())
            num = num.toFixed(2);
            $("#r_sphere").val(num)
        }
        if ($( "#r_cylinder").val()){
            var num = parseFloat($("#r_cylinder").val())
            num = num.toFixed(2);
            $("#r_cylinder").val(num)
        }
        if ($( "#r_addition").val()){
            var num = parseFloat($("#r_addition").val())
            num = num.toFixed(2);
            $("#r_addition").val(num)
        }
        if ($( "#r_pupil_distance").val()){
            var num = parseFloat($("#r_pupil_distance").val())
            num = num.toFixed(2);
            $("#r_pupil_distance").val(num)
        }
        if ($( "#r_pupil_distance").val()){
            var num = parseFloat($("#r_pupil_distance").val())
            num = num.toFixed(2);
            $("#r_pupil_distance").val(num)
        }
        if ($( "#progression_lenght").val()){
            var num = parseFloat($("#progression_lenght").val())
            num = num.toFixed(2);
            $("#progression_lenght").val(num)
        }
        if ($( "#l_sphere").val()){
            var num = parseFloat($("#l_sphere").val())
            num = num.toFixed(2);
            $("#l_sphere").val(num)
        }
        if ($( "#l_cylinder").val()){
            var num = parseFloat($("#l_cylinder").val())
            num = num.toFixed(2);
            $("#l_cylinder").val(num)
        }
        if ($( "#l_addition").val()){
            var num = parseFloat($("#l_addition").val())
            num = num.toFixed(2);
            $("#l_addition").val(num)
        }
        if ($( "#l_pupil_distance").val()){
            var num = parseFloat($("#l_pupil_distance").val())
            num = num.toFixed(2);
            $("#l_pupil_distance").val(num)
        }
        if ($( "#l_progression_length").val()){
            var num = parseFloat($("#l_progression_length").val())
            num = num.toFixed(2);
            $("#l_progression_length").val(num)
        }

    },
    _show_flash_coating_img: function(ev){
        $('.flash-img').hide();
        var id = $('.flash_select').children(":selected").attr("id");
        $('#'+id+'.flash-img').show();
    },
    _select_all_input_text: function(ev){
        $(ev.currentTarget).select();
    },
    _check_input_value: function(input_field){
        if (input_field.hasClass("right")){
           document.getElementById("ranges_alert_right").innerHTML = ""
           document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
           input_field.closest(".incr-decr-control").addClass("_err");
        }
        else {
           document.getElementById("ranges_alert_right").innerHTML = ""
           document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
           input_field.closest(".incr-decr-control").addClass("_err");
        }
    },
    _check_cylinder_prefix: function(input_field){
      var clicked_value = $("input[type='radio'][name='cylinder_prefix']:checked").val();
      if (clicked_value == "-"){
//      $("input[type='radio'][name='right_diameter']:checked")
        if($("input[type='radio'][name='right_diameter']").is(':checked')){
            this._shuffle_right_side_range_text("cylinder");
        }
        if($("input[type='radio'][name='left_diameter']").is(':checked')){
            this._shuffle_left_side_range_text("cylinder");
        }
        var spahre_inp_r = $('#_pres_r_sphere').val()
        var cylinder_value_r = $('#_pres_r_cylinder').val()
        var axis_in_r = $('#_pres_r_axis').val()
        spahre_inp_r = parseFloat(spahre_inp_r)
        cylinder_value_r = parseFloat(cylinder_value_r);
        axis_in_r = parseInt(axis_in_r)
        document.getElementById("_pres_r_sphere").value = (spahre_inp_r + cylinder_value_r).toFixed(2);
        if(cylinder_value_r > 0){
            cylinder_value_r = "-" + cylinder_value_r
        }
        $('#_pres_r_cylinder').val(parseFloat(cylinder_value_r).toFixed(2));
        if (axis_in_r < 90 && axis_in_r != 0){
            document.getElementById("_pres_r_axis").value = axis_in_r + 90;
        }
        else if (axis_in_r >= 90 && axis_in_r != 0){
            document.getElementById("_pres_r_axis").value = axis_in_r - 90;
        }


        var spahre_inp_l = $('#_pres_l_sphere').val()
        var cylinder_value_l = $('#_pres_l_cylinder').val()
        var axis_in_l = $('#_pres_l_axis').val()
        spahre_inp_l = parseFloat(spahre_inp_l)
        cylinder_value_l = parseFloat(cylinder_value_l);
        axis_in_l = parseInt(axis_in_l)
        document.getElementById("_pres_l_sphere").value = (spahre_inp_l + cylinder_value_l).toFixed(2);

        if(cylinder_value_l > 0){
            cylinder_value_l = "-" + cylinder_value_l
        }
        $('#_pres_l_cylinder').val(parseFloat(cylinder_value_l).toFixed(2));

        if (axis_in_l < 90 && axis_in_l != 0){
            document.getElementById("_pres_l_axis").value = axis_in_l + 90;
        }
        else if (axis_in_l >= 90 && axis_in_l != 0){
            document.getElementById("_pres_l_axis").value = axis_in_l - 90;
        }

//
//      //getting values of both sides of lenses and adding minus on them
//        var cylinder_value_r = document.getElementById("_pres_r_cylinder").value;
//        var cylinder_value_l = document.getElementById("_pres_l_cylinder").value;
//        cylinder_value_r = "-" + cylinder_value_r;
//        cylinder_value_l = "-" + cylinder_value_l;
//        //place values after adding minus
//        document.getElementById("_pres_r_cylinder").value = cylinder_value_r;
//        document.getElementById("_pres_l_cylinder").value = cylinder_value_l;
//        //ranges of left sides cylinder and shuffle them
//        var range_text = document.getElementsByClassName("cylinder")[0].innerHTML.split("&nbsp;");
//        var min = range_text[4].split("+");
//        min = "-" + min[1]
//        document.getElementsByClassName("cylinder")[0].innerHTML = min+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text[0];
//        //ranges of right side cylinder and shuffle them
//        var range_text_left = document.getElementsByClassName("cylinder")[1].innerHTML.split("&nbsp;");
//        var min_left = range_text_left[4].split("+");
//        min_left = "-" + min_left[1]
//        document.getElementsByClassName("cylinder")[1].innerHTML = min_left+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text_left[0];

      }
      else{
        if($("input[type='radio'][name='right_diameter']").is(':checked')){
            this._revert_right_side_range_text("cylinder");
        }
        if($("input[type='radio'][name='left_diameter']").is(':checked')){
            this._revert_left_side_range_text("cylinder");
        }
        var spahre_inp_r = $('#_pres_r_sphere').val()
        var cylinder_value_r = $('#_pres_r_cylinder').val()
        var axis_in_r = $('#_pres_r_axis').val()
        spahre_inp_r = parseFloat(spahre_inp_r)
        cylinder_value_r = parseFloat(cylinder_value_r);
        axis_in_r = parseInt(axis_in_r)
        document.getElementById("_pres_r_sphere").value = (spahre_inp_r + cylinder_value_r).toFixed(2);
        if(cylinder_value_r < 0){
            cylinder_value_r = (cylinder_value_r).toString().split("-")
            cylinder_value_r = "+" + cylinder_value_r[1]
        }
        $('#_pres_r_cylinder').val(parseFloat(cylinder_value_r).toFixed(2));
        if (axis_in_r < 90 && axis_in_r != 0){
            document.getElementById("_pres_r_axis").value = axis_in_r + 90;
        }
        else if (axis_in_r >= 90 && axis_in_r != 0){
            document.getElementById("_pres_r_axis").value = axis_in_r - 90;
        }


        var spahre_inp_l = $('#_pres_l_sphere').val()
        var cylinder_value_l = $('#_pres_l_cylinder').val()
        var axis_in_l = $('#_pres_l_axis').val()
        spahre_inp_l = parseFloat(spahre_inp_l)
        cylinder_value_l = parseFloat(cylinder_value_l);
        axis_in_l = parseInt(axis_in_l)
        document.getElementById("_pres_l_sphere").value = (spahre_inp_l + cylinder_value_l).toFixed(2);
        if(cylinder_value_l < 0){
            cylinder_value_l = (cylinder_value_l).toString().split("-")
            cylinder_value_l = "+" + cylinder_value_l[1]
        }
        $('#_pres_l_cylinder').val(parseFloat(cylinder_value_l).toFixed(2));

        if (axis_in_l < 90 && axis_in_l != 0){
            document.getElementById("_pres_l_axis").value = axis_in_l + 90;
        }
        else if (axis_in_l >= 90 && axis_in_l != 0){
            document.getElementById("_pres_l_axis").value = axis_in_l - 90;
        }
      }
    },
    _shuffle_right_side_range_text: function(c_name){
        //ranges of right side and shuffle them
        var min = $('#diameter_max_range_right').html().split("+");

        var range_text = document.getElementsByClassName(c_name)[0].innerHTML.split("&nbsp;");
        var max = range_text[0]
//        var min = range_text[4].split("+");
        if(parseInt(min[1]) > 0){
            min = "-" + min[1]
            document.getElementsByClassName(c_name)[0].innerHTML = min+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text[0];
            $('#_pres_r_cylinder').attr('data-min', min);
            $('#_pres_r_cylinder').attr('data-max', max);

            $('#diameter_max_range_right').html(min);
        }
    },
    _shuffle_left_side_range_text: function(c_name){
        //ranges of left side and shuffle them
        var min_left = $('#diameter_max_range_left').html().split("+");

        var range_text_left = document.getElementsByClassName(c_name)[1].innerHTML.split("&nbsp;");
        var max = range_text_left[0]
//        var min_left = range_text_left[4].split("+");
        if(parseInt(min_left[1]) > 0){
            min_left = "-" + min_left[1]
            document.getElementsByClassName(c_name)[1].innerHTML = min_left+"&nbsp;&nbsp;-&nbsp;&nbsp;"+range_text_left[0];
            $('#_pres_l_cylinder').attr('data-min', min_left);
            $('#_pres_l_cylinder').attr('data-max', max);

            $('#diameter_max_range_left').html(min_left);
        }
    },
    _revert_right_side_range_text: function(c_name){
        // revert ranges of right side and shuffle them
        var range_text = document.getElementsByClassName(c_name)[0].innerHTML.split("&nbsp;");
        if (range_text.indexOf('-') > -1){
//            var min = range_text[0].split("-");

            var min = $('#diameter_max_range_right').html().split("-");
            min = "+" + min[1]
            var pre_text = range_text[4]
            if (pre_text.indexOf('+') == -1){
                pre_text = "+"+range_text[4]
            }
            document.getElementsByClassName(c_name)[0].innerHTML = pre_text+"&nbsp;&nbsp;-&nbsp;&nbsp;"+min;
            $('#_pres_r_cylinder').attr('data-min', pre_text);
            $('#_pres_r_cylinder').attr('data-max', min);

            $('#diameter_max_range_right').html(min);
        }
    },
    _revert_left_side_range_text: function(c_name){
        // revert ranges of left side and shuffle them
        var range_text = document.getElementsByClassName(c_name)[1].innerHTML.split("&nbsp;");
        if (range_text.indexOf('-') > -1){
//            var min = range_text[0].split("-");

            var min = $('#diameter_max_range_left').html().split("-");
            min = "+" + min[1]
            var pre_text = range_text[4]
            if (pre_text.indexOf('+') == -1){
                pre_text = "+"+range_text[4]
            }
            document.getElementsByClassName(c_name)[1].innerHTML = pre_text+"&nbsp;&nbsp;-&nbsp;&nbsp;"+min;
            $('#_pres_l_cylinder').attr('data-min', pre_text);
            $('#_pres_l_cylinder').attr('data-max', min);

            $('#diameter_max_range_left').html(min);
        }
    },
    _cylinder_prefix_plus: function(){
        if($('.right_lens_diameter').is(":checked")){
            var sphere_right = parseFloat($('#_pres_r_sphere').val());
            var sphere_right_max = parseFloat($('#_pres_r_sphere').attr('data-max'));
//                sphere_right_max = sphere_right_max.toFixed(2);

//                var cylinder_max = parseFloat($('#_pres_r_cylinder').attr('data-max'))
            var cylinder_right_max = parseFloat($('#_pres_r_cylinder').attr('data-max'))

            var sphere_absolute = sphere_right + cylinder_right_max;
            if(cylinder_right_max >= 0 && sphere_right >= 0){
                // Check if Sphere Absolute is greater than Cylinder Maximum
                if(sphere_absolute > sphere_right_max){
                    var cylinder_absolute = sphere_absolute - sphere_right_max;
                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_right_max = (cylinder_right_max - cylinder_absolute).toFixed(2);
                    if (parseFloat(cylinder_right_max) >= 0){
                        $('#_pres_r_cylinder').attr('data-max', cylinder_right_max);
                        var cylinder_right_range_text = $('.range_text.cylinder')[0].innerHTML;
                        cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                        cylinder_right_range_text[4] = "+" + cylinder_right_max;
                        cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                        $('.range_text.cylinder')[0].innerHTML = cylinder_right_range_text;

                        var cylinder_value = $('#_pres_r_cylinder').val()
                        var cylinder_max = $('#_pres_r_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_r_cylinder').attr('data-min')
                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
                           $('#_pres_r_cylinder').closest(".incr-decr-control").addClass("_err");
                        }
                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           $('#_pres_r_cylinder').closest(".incr-decr-control").removeClass("_err");
                        }
                    }

                }
                // Check if Sphere Absolute is less than Cylinder Maximum
                if(sphere_absolute < sphere_right_max){
                    var cylinder_absolute = sphere_right_max - sphere_absolute;
                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_right_max = (cylinder_right_max + cylinder_absolute).toFixed(2);

                    // check cylinder_right_max is equal or less than Diameter Cylinder range max value
                    
                    
                    var diameter_max_range_right = $('#diameter_max_range_right').html()
                    
                    diameter_max_range_right = diameter_max_range_right.split('+')
                    diameter_max_range_right = diameter_max_range_right[1]

                    if(cylinder_right_max <= diameter_max_range_right){
                        $('#_pres_r_cylinder').attr('data-max', cylinder_right_max);
                        var cylinder_right_range_text = $('.range_text.cylinder')[0].innerHTML;
                        cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                        cylinder_right_range_text[4] = "+" + cylinder_right_max;
                        cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                        $('.range_text.cylinder')[0].innerHTML = cylinder_right_range_text;

                        var cylinder_value = $('#_pres_r_cylinder').val()
                        var cylinder_max = $('#_pres_r_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_r_cylinder').attr('data-min')
                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
                           $('#_pres_r_cylinder').closest(".incr-decr-control").addClass("_err");
                        }
                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           $('#_pres_r_cylinder').closest(".incr-decr-control").removeClass("_err");
                        }
                    }
                }
            }
        }
        if($('.left_lens_diameter').is(":checked")){
            
            
            var sphere_left = parseFloat($('#_pres_l_sphere').val());
            
            var sphere_left_max = parseFloat($('#_pres_l_sphere').attr('data-max'));
//                sphere_right_max = sphere_right_max.toFixed(2);

//                var cylinder_max = parseFloat($('#_pres_r_cylinder').attr('data-max'))
            var cylinder_left_max = parseFloat($('#_pres_l_cylinder').attr('data-max'))

            var sphere_absolute = sphere_left + cylinder_left_max;
            if(cylinder_left_max >= 0 && sphere_left >= 0){
                // Check if Sphere Absolute is greater than Cylinder Maximum
                if(sphere_absolute > sphere_left_max){
                    var cylinder_absolute = sphere_absolute - sphere_left_max;
                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_left_max = (cylinder_left_max - cylinder_absolute).toFixed(2);
                    if(parseFloat(cylinder_left_max) >=0){
                        $('#_pres_l_cylinder').attr('data-max', cylinder_left_max);
                        var cylinder_left_range_text = $('.range_text.cylinder')[1].innerHTML;
                        cylinder_left_range_text = cylinder_left_range_text.split("&nbsp;");
                        cylinder_left_range_text[4] = "+" + cylinder_left_max;
                        cylinder_left_range_text = cylinder_left_range_text[0] + "&nbsp;&nbsp;" + cylinder_left_range_text[2] + "&nbsp;&nbsp;" + cylinder_left_range_text[4];
                        $('.range_text.cylinder')[1].innerHTML = cylinder_left_range_text;

                        var cylinder_value = $('#_pres_l_cylinder').val()
                        var cylinder_max = $('#_pres_l_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_l_cylinder').attr('data-min')
                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                           document.getElementById("ranges_alert_left").innerHTML = ""
                           document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
                           $('#_pres_l_cylinder').closest(".incr-decr-control").addClass("_err");
                        }
                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                           document.getElementById("ranges_alert_left").innerHTML = ""
                           $('#_pres_l_cylinder').closest(".incr-decr-control").removeClass("_err");
                        }
                    }
                }
                // Check if Sphere Absolute is less than Cylinder Maximum
                if(sphere_absolute < sphere_left_max){
                    var cylinder_absolute = sphere_left_max - sphere_absolute;
                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_left_max = (cylinder_left_max + cylinder_absolute).toFixed(2);

                    // check cylinder_right_max is equal or less than Diameter Cylinder range max value
                    
                    
                    var diameter_max_range_left = $('#diameter_max_range_left').html()
                    
                    diameter_max_range_left = diameter_max_range_left.split('+')
                    diameter_max_range_left = diameter_max_range_left[1]

                    if(cylinder_left_max <= diameter_max_range_left){
                        $('#_pres_l_cylinder').attr('data-max', cylinder_left_max);
                        var cylinder_left_range_text = $('.range_text.cylinder')[1].innerHTML;
                        cylinder_left_range_text = cylinder_left_range_text.split("&nbsp;");
                        cylinder_left_range_text[4] = "+" + cylinder_left_max;
                        cylinder_left_range_text = cylinder_left_range_text[0] + "&nbsp;&nbsp;" + cylinder_left_range_text[2] + "&nbsp;&nbsp;" + cylinder_left_range_text[4];
                        $('.range_text.cylinder')[1].innerHTML = cylinder_left_range_text;

                        var cylinder_value = $('#_pres_l_cylinder').val()
                        var cylinder_max = $('#_pres_l_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_l_cylinder').attr('data-min')
                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                           document.getElementById("ranges_alert_left").innerHTML = ""
                           document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
                           $('#_pres_l_cylinder').closest(".incr-decr-control").addClass("_err");
                        }
                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                           document.getElementById("ranges_alert_left").innerHTML = ""
                           $('#_pres_l_cylinder').closest(".incr-decr-control").removeClass("_err");
                        }
                    }
                }
            }
        }
    },
    _cylinder_prefix_minus: function(){
        if($('.right_lens_diameter').is(":checked")){
            var sphere_right = parseFloat($('#_pres_r_sphere').val());
            var sphere_right_min = parseFloat($('#_pres_r_sphere').attr('data-min'));
//                sphere_right_max = sphere_right_max.toFixed(2);
//                var cylinder_max = parseFloat($('#_pres_r_cylinder').attr('data-max'))
            var cylinder_right_min = parseFloat($('#_pres_r_cylinder').attr('data-min'))
            var sphere_absolute = sphere_right + cylinder_right_min;
            if(cylinder_right_min <= 0){

                // Check if Sphere Absolute is less than Cylinder Maximum
                if(sphere_absolute < sphere_right_min){

                    var cylinder_absolute = sphere_absolute - sphere_right_min;

                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_right_min = (cylinder_right_min - cylinder_absolute).toFixed(2);
                    $('#_pres_r_cylinder').attr('data-min', cylinder_right_min);
                    var cylinder_right_range_text = $('.range_text.cylinder')[0].innerHTML;
                    cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                    cylinder_right_range_text[0] = cylinder_right_min;
                    cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                    $('.range_text.cylinder')[0].innerHTML = cylinder_right_range_text;

                    var cylinder_value = $('#_pres_r_cylinder').val()
                    var cylinder_max = $('#_pres_r_cylinder').attr('data-max')
                    var cylinder_min = $('#_pres_r_cylinder').attr('data-min')
                    if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                       document.getElementById("ranges_alert_right").innerHTML = ""
                       document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
                       $('#_pres_r_cylinder').closest(".incr-decr-control").addClass("_err");
                       debugger;
                       debugger;
                    }
                    else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           $('#_pres_r_cylinder').closest(".incr-decr-control").removeClass("_err");
                    }
                }
                // Check if Sphere Absolute is Greater than Cylinder Maximum
                if(sphere_absolute >= sphere_right_min){

                    var cylinder_absolute = sphere_right_min - sphere_absolute;

//                        cylinder_absolute = "-" + cylinder_absolute;
                    cylinder_absolute = parseFloat(cylinder_absolute);

                    cylinder_right_min = (cylinder_right_min + cylinder_absolute);
//                        cylinder_right_min = (cylinder_right_min + cylinder_absolute).toFixed(2);

                    // check cylinder_right_max is equal or greater than Diameter Cylinder range min value
                    var diameter_max_range_right = $('#diameter_max_range_right').html()
//                        diameter_max_range_right = diameter_max_range_right.split('-')
//                        diameter_max_range_right = diameter_max_range_right[1]

                    if(cylinder_right_min >= diameter_max_range_right){
                        $('#_pres_r_cylinder').attr('data-min', cylinder_right_min);
                        var cylinder_right_range_text = $('.range_text.cylinder')[0].innerHTML;
                        cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                        cylinder_right_min = parseFloat(cylinder_right_min);
                        cylinder_right_min = cylinder_right_min.toFixed(2);
                        cylinder_right_range_text[0] = cylinder_right_min;
                        cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                        $('.range_text.cylinder')[0].innerHTML = cylinder_right_range_text;

                        var cylinder_value = $('#_pres_r_cylinder').val()
                        var cylinder_max = $('#_pres_r_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_r_cylinder').attr('data-min')
                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
                           document.getElementById("ranges_alert_right").innerHTML = ""
                           document.getElementById("ranges_alert_right").innerHTML = "Value outside allowed range";
                           $('#_pres_r_cylinder').closest(".incr-decr-control").addClass("_err");
                        }
                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
                               document.getElementById("ranges_alert_right").innerHTML = ""
                               $('#_pres_r_cylinder').closest(".incr-decr-control").removeClass("_err");
                        }
                    }
                }
            }
        }
        if($('.left_lens_diameter').is(":checked")){
            
            
            var sphere_left = parseFloat($('#_pres_l_sphere').val());
            var sphere_left_min = parseFloat($('#_pres_l_sphere').attr('data-min'));
//                sphere_right_max = sphere_right_max.toFixed(2);

//                var cylinder_max = parseFloat($('#_pres_r_cylinder').attr('data-max'))
            var cylinder_left_min = parseFloat($('#_pres_l_cylinder').attr('data-min'))
            var sphere_absolute = sphere_left + cylinder_left_min;
            
            if(cylinder_left_min <= 0){
                
                
                // Check if Sphere Absolute is less than Cylinder Maximum
                if(sphere_absolute < sphere_left_min){
                    
                    
                    var cylinder_absolute = sphere_absolute - sphere_left_min;

                    cylinder_absolute = parseFloat(cylinder_absolute);
                    cylinder_left_min = (cylinder_left_min - cylinder_absolute).toFixed(2);
                    $('#_pres_l_cylinder').attr('data-min', cylinder_left_min);
                    var cylinder_right_range_text = $('.range_text.cylinder')[1].innerHTML;
                    cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                    cylinder_right_range_text[0] = cylinder_left_min;
                    cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                    $('.range_text.cylinder')[1].innerHTML = cylinder_right_range_text;

                    var cylinder_value = $('#_pres_l_cylinder').val()
                    var cylinder_max = $('#_pres_l_cylinder').attr('data-max')
                    var cylinder_min = $('#_pres_l_cylinder').attr('data-min')
                    debugger;
                    debugger;
//                    if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
//                    debugger;
//                    debugger;
//                       document.getElementById("ranges_alert_left").innerHTML = ""
//                       document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
//                       $('#_pres_l_cylinder').closest(".incr-decr-control").addClass("_err");
//                    }
//                    else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
//                       document.getElementById("ranges_alert_left").innerHTML = ""
//                       $('#_pres_l_cylinder').closest(".incr-decr-control").removeClass("_err");
//                    }
                }
                // Check if Sphere Absolute is Greater than Cylinder Maximum
                if(sphere_absolute >= sphere_left_min){
                    
                    
                    
                    var cylinder_absolute = sphere_left_min - sphere_absolute;

//                        cylinder_absolute = "-" + cylinder_absolute;
                    cylinder_absolute = parseFloat(cylinder_absolute);

                    cylinder_left_min = (cylinder_left_min + cylinder_absolute);
                    
//                        cylinder_right_min = (cylinder_right_min + cylinder_absolute).toFixed(2);

                    // check cylinder_right_max is equal or greater than Diameter Cylinder range min value
                    var diameter_max_range_right = $('#diameter_max_range_left').html()
//                        diameter_max_range_right = diameter_max_range_right.split('-')
//                        diameter_max_range_right = diameter_max_range_right[1]

                    if(cylinder_left_min >= diameter_max_range_right){
                        
                        
                        $('#_pres_l_cylinder').attr('data-min', cylinder_left_min);
                        var cylinder_right_range_text = $('.range_text.cylinder')[1].innerHTML;
                        cylinder_right_range_text = cylinder_right_range_text.split("&nbsp;");
                        cylinder_left_min = parseFloat(cylinder_left_min);
                        cylinder_left_min = cylinder_left_min.toFixed(2);
                        cylinder_right_range_text[0] = cylinder_left_min;
                        cylinder_right_range_text = cylinder_right_range_text[0] + "&nbsp;&nbsp;" + cylinder_right_range_text[2] + "&nbsp;&nbsp;" + cylinder_right_range_text[4];
                        $('.range_text.cylinder')[1].innerHTML = cylinder_right_range_text;

                        var cylinder_value = $('#_pres_l_cylinder').val()
                        var cylinder_max = $('#_pres_l_cylinder').attr('data-max')
                        var cylinder_min = $('#_pres_l_cylinder').attr('data-min')
                        debugger;
                        debugger;
//                        if (cylinder_value < cylinder_min || cylinder_value > cylinder_max){
//
//                           document.getElementById("ranges_alert_left").innerHTML = ""
//                           document.getElementById("ranges_alert_left").innerHTML = "Value outside allowed range";
//                           $('#_pres_l_cylinder').closest(".incr-decr-control").addClass("_err");
//                        }
//                        else if (cylinder_value >= cylinder_min || cylinder_value <= cylinder_max){
//                           document.getElementById("ranges_alert_left").innerHTML = ""
//                           $('#_pres_l_cylinder').closest(".incr-decr-control").removeClass("_err");
//                        }
                    }
                }
            }
        }
    },
    _show_products: function(e){
        if($(e.target).hasClass("all_categ")){
            $(".all_products").hide();
            $(".pics_categ").show();
        }
        else{
            $(".all_products").show();
            $(".pics_categ").hide();
        }

    },
    _validate_individual_parameters: function(){
        if( (!$('#pd_right_field').val()) || (!$('#pd_left_field').val())){
            return
        }
    },
    _show_individual_page: function(){
        $("#color_page").hide();
        $("#coating_page").hide();
        $("#individual_page").show();
    },
  });
});

