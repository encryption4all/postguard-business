# PostGuard for Business — Requirements

1. Have a landing page, explaining PostGuard for Business
2. Have a similar but distinctive look from PostGuard personal (/Users/rubenhensen/Repos/postguard-website), maybe by using a other but similar color scheme (maybe a purple color way, or a darker blue then this site)
3. Should probably also be sveltekit, so we can reuse components easily.
4. Should use the latest of everything, the latest sveltekit, make sure nothing is outdated from the start
5. It should have an automated release pipeline which publishes to GHCR like other repos of encryption4all
6. Have a staging and prod release PR on @../postguard-ops/
7. Have a pricing page.
8. Have a registration page, where businesses can apply for PostGuard for Business
9. Have a portal/login/management page. Where applied businesses can manage their account.
   - 9.1 It should have a page for API-key management, that can make users create new API-keys and choose which of the information that api key should sign with. So if they for example have an org name, phone number, kvk-number and an email address. They should be able to choose with what information that api key will sign the email. Then when they generate the api key, they should see it one time. The main page is just a list of api keys with the name the owner gave that key, when it was last used and a delete button with a confirmation of course.
   - 9.2 It should have a data/information page with all the info for the account, such as email, domain name, contact person full name, org name, phone number, kvk-number etc. For the org name and domain name you can make a request to change it. For the rest you should be able to use Yivi and verify that you are the owner/contact person by providing your full name attribute and that you own an email address that is the same email address as the companies. I think this is a bit to complex for now though, so make sure this is documented somewhere if you do not succeed in this. Your fallback is to have it on request basis just like the email domain and the org name.
   - 9.3 An email log page. In this screen you can request a full Audit log. But also revoke emails and see read receipts.
   - 9.4 It should have a page for DNS verification where they get instructions on how to set up their DNS server and a validate button. And when we have validated it to be correct, we can send email on their behalf.
10. It should have an admin page, where we can log in with yivi by providing your full name, email and phonenumber of an admin account.
    - 10.1 An admin can see request from organisations, click on it, give a description on what they did to validate that the change is valid, then approve the change. This should be logged.
    - 10.2 All actions of an admin are logged.
    - 10.3 An admin should be able to impersonate organisations to see what they see.
    - 10.4 An admin should be able to revoke any API-key.
    - 10.5 An admin should be able to create any API-key.
11. The development setup should be able to be run completely locally and only require one command to get up and running `docker-compose up`
12. Should have testing baked in from the beginning. Tests should be written first, fail, then an implementation should be written to make the test pass. Use TDD.
13. Make small commits along the way. Make sure every big feature has a feature flag, so it can be turned on and off.
14. You may ask clarifying questions now, but after that do not stop until it is finished.
