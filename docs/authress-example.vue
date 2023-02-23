<template>
    <openapi-explorer :spec-url="openapiSpecificationUrl" :server-url="serverUrl" hide-server-selection fill-defaults="true"
        nav-item-spacing="compact" :explorer-location="initialPath" primary-color="#3E6077" secondary-color="#FBAF0B"
        :bg-color="colors.light" :nav-bg-color="colors.dark" :text-color="colors.grey" :nav-hover-text-color="colors.light">
        <div slot="overview">
        <h2 class="mt-4">Authress API</h2>
        <div class="row">
            <div class="col-12 col-md-7">
            <words>This is the Authress API. Anything that can be done in the UI is also provided below.</words>
            <br>
            <b-form-group v-if="accountDomain">
                <words><small>All API calls for Authress for the account should be made to this domain.</small></words>
                <copy-input v-model="accountDomain">API Host</copy-input>
            </b-form-group>
            </div>

            <div class="col-12 col-md-5 mt-3 mt-md-0">
            <div class="d-flex justify-content-center">
                <h4>SDKs</h4>
            </div>
            <div class="d-flex justify-content-around">
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="() => open('C#', 'https://www.nuget.org/packages/Authress.SDK/')">
                <img :src="images.cSharpImage" width="50px" class="responsive">
                </b-card>
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="() => open('Python', 'https://pypi.org/project/authress-sdk/')">
                <img :src="images.pythonImage" width="50px" class="responsive">
                </b-card>
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="() => open('NodeJS', 'https://www.npmjs.com/package/authress-sdk')">
                <img :src="images.nodejsImage" width="50px" class="responsive">
                </b-card>
            </div>
            <div class="d-flex justify-content-around">
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="() => open('Ruby', 'https://rubygems.org/gems/authress-sdk')">
                <img :src="images.rubyImage" width="50px" class="responsive">
                </b-card>
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="() => open('Php', 'https://packagist.org/packages/authress/authress-sdk.php')">
                <img :src="images.phpImage" width="50px" class="responsive">
                </b-card>
                <b-card body-class="hover-select d-flex justify-content-center align-items-center" style="width: 90px; max-height: 90px;" @click="sdks.request = true">
                <div class="d-flex justify-content-center w-100">
                    <i class="fa fa-plus fa-lg text-primary" />
                </div>
                <feature-in-progress-modal feature="RequestSdk" v-model="sdks.request" />
                </b-card>
            </div>
            </div>
        </div>
        </div>
        <div slot="authentication">
        <h2>Authentication</h2>
        <h4>API Tokens</h4>
        <p>Authorization for Authress is handled one of two different ways. Both mechanisms use oauth2 <i>Bearer</i> tokens.</p>
        <ul>
            <li><b-link :to="{ name: 'Home', query: { focus: 'identity' } }">Link identity provider</b-link></li>
            <li><b-link :to="{ name: 'Home', query: { focus: 'clients' } }">Create Authress service client</b-link></li>
        </ul>

        <br>
        <h4>Permissions</h4>
        <p>Access to the following APIs is based on Authress permissions, not the application permissions assigned in Authress to the application services.
            Each resource is tagged with the required permission <b-badge variant="outline-secondary">Action: Resource</b-badge></p>

        <br>
        <h4>Priced Routes</h4>
        <p>Most of the api available is completely free. Use it to populate your roles and configure your account. You'll only be charged for the ones marked as Billable.
            <small><external-link href="https://authress.io/knowledge-base/api-billing-caching">(See the full billing guide)</external-link></small></p>
        <p><ul>
            <li><i class="far fa-fw fa-money-bill-alt text-primary" /> <span class="text-primary">Billable</span> - <small>These APIs count as calls for your account and will be charged.</small></li>
            <li><i class="fas fa-fw fa-angle-double-right text-secondary" /> <span class="text-secondary">Free</span> - <small>These are totally free.</small></li>
            <li><i class="fas fa-fw fa-balance-scale text-secondary" /> <span class="text-secondary">Condition</span> - <small>Are conditionally free, see api methods for details.</small></li>
        </ul></p>
        </div>
        <div slot="nav-tag--Accounts" />
        <div slot="get-/v1/users/-userId-/resources"><b-badge variant="outline-secondary">READ: Authress:UserPermissions/{userId}</b-badge> <b-badge variant="outline-primary">$</b-badge></div>
        <div slot="get-/v1/users/-userId-/resources/-resourceUri-/permissions">
            <b-badge variant="outline-secondary">READ: Authress:UserPermissions/{userId}</b-badge> <b-badge variant="outline-primary">$</b-badge>
        </div>
        <div slot="get-/v1/users/-userId-/resources/-resourceUri-/permissions/-permission-">
            <b-badge variant="outline-secondary">READ: Authress:UserPermissions/{userId}</b-badge> <b-badge variant="outline-primary">$</b-badge>
        </div>
        <div slot="get-/v1/users/-userId-/resources/-resourceUri-/roles">
            <b-badge variant="outline-secondary">READ: Authress:UserPermissions/{userId}</b-badge> <b-badge variant="outline-primary">$</b-badge>
        </div>
    </openapi-explorer>
</template>
