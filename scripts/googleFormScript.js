/**
 * Erlume Seller Registration — Google Apps Script
 *
 * Setup:
 *   1. Open Google Form → Extensions → Apps Script
 *   2. Paste this entire file
 *   3. Set BACKEND_URL to your deployed backend URL
 *   4. Click "Triggers" (clock icon) → Add trigger:
 *        Function: onFormSubmit
 *        Event source: From form
 *        Event type: On form submit
 *   5. Save & authorise
 */

const BACKEND_URL = "https://YOUR-BACKEND-URL/api/sellers/from-form";

function onFormSubmit(e) {
  try {
    var response = e.response;
    var answers  = response.getItemResponses();

    // Map question titles → values
    var data = {};
    answers.forEach(function(item) {
      var title = item.getItem().getTitle().trim();
      var value = item.getResponse();
      data[title] = value;
    });

    // The form also collects email automatically
    var emailAddress = response.getRespondentEmail
      ? response.getRespondentEmail()
      : data["Email"] || "";

    var payload = {
      fullName:               data["Full Name - الاسم الكامل"] || data["Full Name"] || "",
      phoneNumber:            data["Phone Number - رقم الهاتف"] || data["Phone Number"] || "",
      preferredPickupAddress: data["Preferred pickup address - العنوان المفضل للاستلام"] || data["Preferred pickup address"] || "",
      consent:                data["Do you agree to erlume's Seller Terms & Conditions, including commission and authentication policies?\nهل توافق على شروط وأحكام البائع الخاصة بـ ايرلوم، بما في ذلك العمولة وسياسة التوثيق؟"] || "",
      emailAddress:           emailAddress,
    };

    var options = {
      method:      "post",
      contentType: "application/json",
      payload:     JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var result = UrlFetchApp.fetch(BACKEND_URL, options);
    var code   = result.getResponseCode();
    var body   = result.getContentText();

    Logger.log("Status: " + code);
    Logger.log("Response: " + body);

    if (code !== 201) {
      Logger.log("WARNING: Unexpected response code " + code);
    }
  } catch (err) {
    Logger.log("ERROR in onFormSubmit: " + err.toString());
  }
}
