<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
                xmlns:ns="http://schemas.microsoft.com/appx/2010/manifest"
                xmlns:ns2="http://schemas.microsoft.com/appx/2013/manifest" >
  <xsl:output method="html" indent="yes"/>
  <xsl:variable name="debug" select="0" />
  <xsl:variable name="scrollBarShowLimit" select="10" />
  <xsl:variable name="strings" select="document('wslk_strings.xml')/strings"/>
  <xsl:template name="GetString">
    <xsl:param name="id"/>
    <xsl:param name="altId"/>
    <!-- Retrieves the string from the localized string document. -->
    <xsl:choose>
      <xsl:when test="$strings/string[@id=$id]">
        <xsl:value-of select="$strings/string[@id=$id]"/>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="REPORT">
    <html xmlns="http://www.w3.org/1999/xhtml" >
      <xsl:attribute name="lang">
        <xsl:value-of select="@xml:lang" />
      </xsl:attribute>
      <head>
        <title>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">ReportTitle</xsl:with-param>
          </xsl:call-template>
        </title>
        <style type="text/css">
          BODY, TH, TD { font-family: Segoe UI; font-size: 10.5pt; color: #2a2a2a; margin: 0 18pt; padding: 0; }
          .titleLarge { margin-top: 9pt; font-family: Segoe UI Light; font-size: 25pt; font-weight: normal; }
          .titleItem { font-family: Segoe UI Light; font-weight: bold; font-size: 15pt; margin: 0 5pt 0 5pt; }
          .overall { font-size: 20pt; font-weight: bold; }
          .overall p { margin: 3pt; font-size: 10.5pt; font-weight: normal; }
          .ulMessagesOverflow { list-style-type: circle; background-color: #cccccc; border-color: black; height: 150px; overflow-y: scroll;overflow-x: hidden;}
          .ulMessagesNoOverflow { list-style-type: circle; background-color: #cccccc; border-color: black;}
          ul.ulMessagesOverflow li { margin: 0; padding: 0;  font-family: Courier New; font-size: 9pt; line-height: 11.5pt; }
          ul.ulMessagesNoOverflow li { margin: 0; padding: 0;  font-family: Courier New; font-size: 9pt; line-height: 11.5pt; }
          dt { line-height: 18pt; }
          .testresults, dd { font-weight: normal; line-height: 18pt; }
          dt.testresults { text-indent: 0.25in; float: left; width: 130pt; line-height: 18pt; }
          .messageHeading { font-weight: bolder; color:#808080; }
        </style>
      </head>
      <body>
        <div class="titleLarge">
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">ReportTitle</xsl:with-param>
          </xsl:call-template>
        </div>
        <xsl:if test="count(APPLICATIONS/Installed_Programs/Program)=1">
          <xsl:choose>
            <xsl:when test="@APP_TYPE = 'Desktop' or @APP_TYPE = 'DriverAddin'">
              <xsl:apply-templates select="APPLICATIONS/Installed_Programs/Program" mode="Desktop"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="APPLICATIONS/Installed_Programs/Program/Indicators/WindowsStoreAppManifestIndicators/PackageManifest/*[local-name()='Package']/*[local-name()='Properties']" />
              <xsl:apply-templates select="APPLICATIONS/Installed_Programs/Program" mode="Store"/>
              <xsl:apply-templates select="APPLICATIONS/Installed_Programs/Program/Indicators/WindowsStoreAppManifestIndicators/PackageManifest/Package/Identity" mode="Store"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:if>
        <xsl:variable name="kitVersion" select="@VERSION" />
        <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">KitVersion</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:value-of select="@VERSION" />
          </dd>
        </div>
        <xsl:variable name="osVersion" select="@OSVERSION" />
        <xsl:variable name="osCaption" select="@OS" />
        <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
          <xsl:choose>
            <xsl:when test="string-length($osCaption)=0 and string-length($osVersion)=0">
              <dt>
                <xsl:call-template name="GetString">
                  <xsl:with-param name="id">OSDetails</xsl:with-param>
                </xsl:call-template>
              </dt>
              <dd style="font-weight: bolder;">
                <xsl:call-template name="GetString">
                  <xsl:with-param name="id">NotAvailable</xsl:with-param>
                </xsl:call-template>
              </dd>
            </xsl:when>
            <xsl:otherwise>
              <dt>
                <xsl:call-template name="GetString">
                  <xsl:with-param name="id">OSDetails</xsl:with-param>
                </xsl:call-template>
              </dt>
              <dd style="font-weight: bolder;">
                <xsl:value-of select="concat($osCaption, ' (', $osVersion, ')')" />
              </dd>
            </xsl:otherwise>
          </xsl:choose>
        </div>
        <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">Architecture</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:value-of select="@TOOLSET_ARCHITECTURE" />
          </dd>
        </div>

        <xsl:apply-templates select="@ReportGenerationTime" mode="TimeStamp" />
        <xsl:call-template name="VERSION_WARNING">
          <xsl:with-param name="latestVer" select="@LATEST_VERSION" />
          <xsl:with-param name="downloadURL" select="@UPDATE_DOWNLOAD_URL" />
          <xsl:with-param name="appType" select="@APP_TYPE" />
        </xsl:call-template>
        <xsl:call-template name="PARTIAL_RUN_WARNING">
          <xsl:with-param name="partialRun" select="@PARTIAL_RUN" />
          <xsl:with-param name="appType" select="@APP_TYPE" />
        </xsl:call-template>
        <xsl:call-template name="X64_ONLY_WARNING">
          <xsl:with-param name="onlyx64" select="@X64_ONLY" />
          <xsl:with-param name="appType" select="@APP_TYPE" />
        </xsl:call-template>
        <br/>

        <hr/>
        <xsl:apply-templates select="@OVERALL_RESULT" mode="OverallResult">
          <xsl:with-param name="vTypePresent" select="count(@VALIDATION_TYPE)" />
        </xsl:apply-templates>
        <br/>
        <hr/>
        <div>
          <xsl:apply-templates select="REQUIREMENTS/REQUIREMENT">
            <xsl:with-param name="showOptionalTests" select="'FALSE'" />
            <xsl:with-param name="appType" select="@APP_TYPE" />
          </xsl:apply-templates>
        </div>
        <xsl:if test="count(REQUIREMENTS/REQUIREMENT/TEST[@OPTIONAL = 'TRUE']) &gt; 0">
          <br/>
          <hr/>
          <xsl:apply-templates select="@OVERALL_RESULT" mode="OptionalResults">
          </xsl:apply-templates>
          <br/>
          <hr/>
          <div>
            <xsl:apply-templates select="REQUIREMENTS/REQUIREMENT">
              <xsl:with-param name="showOptionalTests" select="'TRUE'" />
              <xsl:with-param name="appType" select="@APP_TYPE" />
            </xsl:apply-templates>
          </div>
        </xsl:if>
        <div>
          <xsl:apply-templates select="WAIVERS">
          </xsl:apply-templates>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="PARTIAL_RUN_WARNING">
    <xsl:param name="partialRun" />
    <xsl:param name="appType" />
    <xsl:if test="$partialRun='TRUE'">
      <xsl:if test="$appType!='Desktop' and $appType!='DriverAddin'">
        <br/>
        <i style ="color:red;" >
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">PartialRunWarningWindowsStore</xsl:with-param>
          </xsl:call-template>
        </i>
        <a href="http://go.microsoft.com/fwlink/?LinkId=534734">
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">PartialRunWarningLearnMore</xsl:with-param>
          </xsl:call-template>
        </a>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template name="X64_ONLY_WARNING">
    <xsl:param name="onlyx64" />
    <xsl:param name="appType" />
    <xsl:if test="$onlyx64='TRUE'">
      <xsl:if test="$appType!='Desktop' and $appType!='DriverAddin' and $appType!='Centennial'">
        <br/>
        <i style ="color:red;" >
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">x64OnlyWarning</xsl:with-param>
          </xsl:call-template>
        </i>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template name="VERSION_WARNING">
    <xsl:param name="latestVer" />
    <xsl:param name="downloadURL" />
    <xsl:param name="appType" />
    <xsl:if test="$latestVer='FALSE'">
      <xsl:choose>
        <xsl:when test="$appType!='Desktop' and $appType!='DriverAddin'">
          <br/>
          <i style="color:red;">
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">VersionWarningStore</xsl:with-param>
            </xsl:call-template>
            <br/>
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="$downloadURL" />
              </xsl:attribute>
              <xsl:call-template name="GetString">
                <xsl:with-param name="id">ClickToDownload</xsl:with-param>
              </xsl:call-template>
            </a>

          </i>
        </xsl:when>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template match="*[local-name()='Properties']">
    <xsl:variable name="appName">
      <xsl:choose>
        <xsl:when test="string-length(DisplayName)!=0">
          <xsl:value-of select="DisplayName" />
        </xsl:when>
        <xsl:when test="string-length(ns:DisplayName)!=0">
          <xsl:value-of select="ns:DisplayName" />
        </xsl:when>
        <xsl:when test="string-length(ns2:DisplayName)!=0">
          <xsl:value-of select="ns2:DisplayName" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">NotAvailable</xsl:with-param>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="appVendor">
      <xsl:choose>
        <xsl:when test="string-length(PublisherDisplayName)!=0">
          <xsl:value-of select="PublisherDisplayName" />
        </xsl:when>
        <xsl:when test="string-length(ns:PublisherDisplayName)!=0">
          <xsl:value-of select="ns:PublisherDisplayName" />
        </xsl:when>
        <xsl:when test="string-length(ns2:PublisherDisplayName)!=0">
          <xsl:value-of select="ns2:PublisherDisplayName" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">NotAvailable</xsl:with-param>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <dt>
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">AppName</xsl:with-param>
        </xsl:call-template>
      </dt>
      <dd style="font-weight: bolder;">
        <xsl:value-of select="$appName" />
      </dd>
    </div>
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <dt>
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">AppPublisher</xsl:with-param>
        </xsl:call-template>
      </dt>
      <dd style="font-weight: bolder;">
        <xsl:value-of select="$appVendor" />
      </dd>
    </div>
  </xsl:template>

  <xsl:template match="Program" mode="Store">
    <xsl:variable name="appVersion" select="@Version" />
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <xsl:choose>
        <xsl:when test="string-length($appVersion)=0">
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">AppVersion</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">NotAvailable</xsl:with-param>
            </xsl:call-template>
          </dd>
        </xsl:when>
        <xsl:otherwise>
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">AppVersion</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:value-of select="$appVersion" />
          </dd>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template match="Identity" mode="Store">
    <xsl:variable name="appArchitecture" select="@ProcessorArchitecture" />
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <xsl:choose>
        <xsl:when test="string-length($appArchitecture)=0">
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">AppArchitecture</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">NotAvailable</xsl:with-param>
            </xsl:call-template>
          </dd>
        </xsl:when>
        <xsl:otherwise>
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">AppArchitecture</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:value-of select="$appArchitecture" />
          </dd>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template match="Program" mode="Desktop">
    <xsl:variable name="appName">
      <xsl:choose>
        <xsl:when test="string-length(@Name)!=0">
          <xsl:value-of select="@Name" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">NotAvailable</xsl:with-param>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="appVendor">
      <xsl:choose>
        <xsl:when test="string-length(@Publisher)!=0">
          <xsl:value-of select="@Publisher" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">NotAvailable</xsl:with-param>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="appVersion">
      <xsl:choose>
        <xsl:when test="string-length(@Version)!=0">
          <xsl:value-of select="@Version" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="GetString">
            <xsl:with-param name="id">NotAvailable</xsl:with-param>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <dt>
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">AppName</xsl:with-param>
        </xsl:call-template>
      </dt>
      <dd style="font-weight: bolder;">
        <xsl:value-of select="$appName" />
      </dd>
    </div>
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <dt>
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">AppPublisher</xsl:with-param>
        </xsl:call-template>
      </dt>
      <dd style="font-weight: bolder;">
        <xsl:value-of select="$appVendor" />
      </dd>
    </div>
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <dt>
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">AppVersion</xsl:with-param>
        </xsl:call-template>
      </dt>
      <dd style="font-weight: bolder;">
        <xsl:value-of select="$appVersion" />
      </dd>
    </div>
  </xsl:template>

  <xsl:template match="@* | node()" mode="TimeStamp">
    <xsl:variable name="reportTimestamp" select="." />
    <div xmlns="http://www.w3.org/1999/xhtml" class="appInfo">
      <xsl:choose>
        <xsl:when test="string-length($reportTimestamp)=0">
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">RepGenTime</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">NotAvailable</xsl:with-param>
            </xsl:call-template>
          </dd>
        </xsl:when>
        <xsl:otherwise>
          <dt>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">RepGenTime</xsl:with-param>
            </xsl:call-template>
          </dt>
          <dd style="font-weight: bolder;">
            <xsl:value-of select="$reportTimestamp" />
          </dd>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template match="@* | node()" mode="OverallResult">
    <xsl:param name="vTypePresent" />
    <xsl:variable name="curType" select="." />
    <div xmlns="http://www.w3.org/1999/xhtml" class="overall">
      <xsl:call-template name="GetString">
        <xsl:with-param name="id">OverallScore</xsl:with-param>
      </xsl:call-template>
      <xsl:element name="span">
        <xsl:choose>
          <xsl:when test="$vTypePresent=0">
            <xsl:attribute name="style">color: blue;</xsl:attribute>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">InterimRepNotice</xsl:with-param>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="$curType='PASS'">
            <xsl:attribute name="style">color: green;</xsl:attribute>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">ResultPass</xsl:with-param>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="$curType='FAIL'">
            <xsl:attribute name="style">color: red;</xsl:attribute>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">ResultFail</xsl:with-param>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="$curType='WARNING'">
            <xsl:attribute name="style">color: orange;</xsl:attribute>
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">ResultPwW</xsl:with-param>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <xsl:attribute name="style">color: gray;</xsl:attribute>
            <xsl:value-of select="$curType"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:element>
      <p>
        <xsl:choose>
          <xsl:when test="$curType='WARNING'">
            <xsl:call-template name="GetString">
              <xsl:with-param name="id">FixWarningCases</xsl:with-param>
            </xsl:call-template>
          </xsl:when>
        </xsl:choose>
      </p>
    </div>
  </xsl:template>

  <xsl:template match="REQUIREMENT">
    <xsl:param name="showOptionalTests" />
    <xsl:param name="appType" />
    <xsl:variable name="reqIndex" select="@NUMBER" />
    <xsl:variable name="counter" select="0" />
    <xsl:if test="(count(TEST[@OPTIONAL = $showOptionalTests]) &gt; 0) or 
                  ($showOptionalTests = 'FALSE' and count(TEST[not(@OPTIONAL)]) &gt; 0)">
      <div xmlns="http://www.w3.org/1999/xhtml" class="titleItem">
        <xsl:element name="span">
          <xsl:value-of select="@TITLE"/>
        </xsl:element>
        <br />
        <br />
      </div>
      <div xmlns="http://www.w3.org/1999/xhtml">
        <xsl:apply-templates select="TEST[@OPTIONAL = $showOptionalTests or not(@OPTIONAL)]">
          <xsl:with-param name="reqIndex" select="$reqIndex" />
          <xsl:with-param name="appType" select="$appType" />
        </xsl:apply-templates>
      </div>
      <br xmlns="http://www.w3.org/1999/xhtml"/>
      <br xmlns="http://www.w3.org/1999/xhtml"/>
    </xsl:if>
  </xsl:template>

  <xsl:template match="TEST">
    <xsl:param name="reqIndex" />
    <xsl:param name="appType" />
    <xsl:variable name="testIndex" select="@INDEX" />
    <div class="testresults">
      <xsl:choose>
        <xsl:when test="RESULT='PASS'">
          <dt class ="testresults" xmlns="http://www.w3.org/1999/xhtml">
            <b style="color:green;">
              <xsl:call-template name="GetString">
                <xsl:with-param name="id">ResultPass</xsl:with-param>
              </xsl:call-template>
            </b>
          </dt>
          <dd xmlns="http://www.w3.org/1999/xhtml">
            <div style="line-height: 18pt;">
              <xsl:value-of select="@NAME" />
            </div>
          </dd>
        </xsl:when>
        <xsl:when test="RESULT='WARNING'">
          <dt class ="testresults" xmlns="http://www.w3.org/1999/xhtml">
            <b style="color:orange;">
              <xsl:call-template name="GetString">
                <xsl:with-param name="id">ResultWarn</xsl:with-param>
              </xsl:call-template>
            </b>
          </dt>
          <dd xmlns="http://www.w3.org/1999/xhtml">
            <div style="line-height: 18pt;">
              <xsl:value-of select="@NAME" />
            </div>
          </dd>
        </xsl:when>
        <xsl:when test="RESULT='FAIL'">
          <dt class ="testresults" xmlns="http://www.w3.org/1999/xhtml">
            <b style="color:red;">
              <xsl:call-template name="GetString">
                <xsl:with-param name="id">ResultFail</xsl:with-param>
              </xsl:call-template>
            </b>
          </dt>
          <dd xmlns="http://www.w3.org/1999/xhtml">
            <div style="line-height: 18pt;">
              <xsl:value-of select="@NAME" />
            </div>
          </dd>
        </xsl:when>
        <xsl:when test="RESULT='SKIPPED'">
          <dt class ="testresults" xmlns="http://www.w3.org/1999/xhtml">
            <b style="color:#243B0B;">
              <xsl:call-template name="GetString">
                <xsl:with-param name="id">ResultSkip</xsl:with-param>
              </xsl:call-template>
            </b>
          </dt>
          <dd xmlns="http://www.w3.org/1999/xhtml">
            <div style="line-height: 18pt;">
              <xsl:value-of select="@NAME" />
            </div>
          </dd>
        </xsl:when>
        <xsl:otherwise>
          <dt class ="testresults" xmlns="http://www.w3.org/1999/xhtml">
            <b style="color:#51BD8D;">
              <xsl:value-of select="RESULT"/>
            </b>
          </dt>>
          <dd xmlns="http://www.w3.org/1999/xhtml">
            <xsl:value-of select="@NAME" />
          </dd>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:choose>
        <xsl:when test="RESULT='PASS'"></xsl:when>
        <xsl:when test="RESULT='SKIPPED'"></xsl:when>
        <xsl:otherwise>
          <xsl:variable name="uniqueTestId">
            <xsl:value-of select="$reqIndex" />
            <xsl:text>_</xsl:text>
            <xsl:value-of select="$testIndex" />
          </xsl:variable>
          <xsl:call-template name="testError">
            <xsl:with-param name="reqNdx" select="$reqIndex" />
            <xsl:with-param name="tstNdx" select="$testIndex" />
            <xsl:with-param name="tstRslt" select="RESULT" />
            <xsl:with-param name="uniqueTstId" select="$uniqueTestId" />
            <xsl:with-param name="ngenFailure" select="@NGENFailed" />
            <xsl:with-param name="appType" select="$appType" />
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
      <br/>
    </div>
  </xsl:template>

  <xsl:template name="testError">
    <xsl:param name="reqNdx" />
    <xsl:param name="tstNdx" />
    <xsl:param name="tstRslt" />
    <xsl:param name="uniqueTstId" />
    <xsl:param name="ngenFailure" />
    <xsl:param name="appType" />
    <!-- one-off exceptions to the normal flow of the document (that need something before the list item). -->
    <xsl:if test="$reqNdx='3' and $tstNdx='2' and not(contains($appType, 'Centennial'))">
      <div xmlns="http://www.w3.org/1999/xhtml" style="text-indent: 10px;">
        <xsl:call-template name="GetString">
          <xsl:with-param name="id">SignedFilesExtraMessage</xsl:with-param>
        </xsl:call-template>
      </div>
    </xsl:if>
    <ul xmlns="http://www.w3.org/1999/xhtml" style="list-style-type: disc; margin: 0; margin-left: 120pt;">
      <xsl:choose>
        <xsl:when test="$reqNdx='1'">
          <xsl:choose>
            <xsl:when test="$tstNdx='12'">
              <li>
                <div>
                  <span>
                    <xsl:if test="$tstRslt='WARNING'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestWarning</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="$tstRslt='FAIL'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestError</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="count(MESSAGES/MESSAGE) = 0">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_1_NoChange</xsl:with-param>
                      </xsl:call-template>
                    </xsl:if>
                    <xsl:if test="count(MESSAGES/MESSAGE) &gt; 0">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_1_FailedToRemovFiles</xsl:with-param>
                      </xsl:call-template>
                    </xsl:if>
                  </span>
                  <xsl:if test="count(MESSAGES/MESSAGE) &gt; 0">
                    <xsl:if test="count(MESSAGES/MESSAGE) &gt;= $scrollBarShowLimit">
                      <ul class="ulMessagesOverflow">
                        <xsl:apply-templates select="MESSAGES">
                          <xsl:with-param name="testIndex" select="$uniqueTstId" />
                        </xsl:apply-templates>
                      </ul>
                    </xsl:if>
                    <xsl:if test="count(MESSAGES/MESSAGE) &lt; $scrollBarShowLimit">
                      <ul class="ulMessagesNoOverflow">
                        <xsl:apply-templates select="MESSAGES">
                          <xsl:with-param name="testIndex" select="$uniqueTstId" />
                        </xsl:apply-templates>
                      </ul>
                    </xsl:if>
                  </xsl:if>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_1_Impact</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_1_HowToFix</xsl:with-param>
                    </xsl:call-template>
                    <br/>
                    <a href="http://go.microsoft.com/fwlink/?LinkID=247352">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_1_HowToFix2</xsl:with-param>
                      </xsl:call-template>
                    </a>
                  </span>
                </div>
              </li>
            </xsl:when>
            <xsl:when test="$tstNdx='8'">
              <li>
                <div>
                  <span>
                    <xsl:if test="$tstRslt='WARNING'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestWarning</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="$tstRslt='FAIL'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestError</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_2_RebootRqd</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_2_Impact</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_2_HowToFix1</xsl:with-param>
                    </xsl:call-template>
                    <br/>
                    <a href="http://go.microsoft.com/fwlink/?LinkId=247353">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_2_HowToFix2</xsl:with-param>
                      </xsl:call-template>
                    </a>
                  </span>
                </div>
              </li>
            </xsl:when>
            <xsl:when test="$tstNdx='9'">
              <li>
                <div>
                  <span>
                    <xsl:if test="$tstRslt='WARNING'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestWarning</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="$tstRslt='FAIL'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestError</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_3_RebootRqd</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_3_Impact</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_3_HowToFix1</xsl:with-param>
                    </xsl:call-template>
                    <br/>
                    <a href="http://go.microsoft.com/fwlink/?LinkId=247353">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_3_HowToFix2</xsl:with-param>
                      </xsl:call-template>
                    </a>
                  </span>
                </div>
              </li>
            </xsl:when>
            <xsl:when test="$tstNdx='5'">
              <li>
                <div>
                  <xsl:if test="$tstRslt='WARNING'">
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">TestWarning</xsl:with-param>
                      </xsl:call-template>
                    </span>
                  </xsl:if>
                  <xsl:if test="$tstRslt='FAIL'">
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">TestError</xsl:with-param>
                      </xsl:call-template>
                    </span>
                  </xsl:if>
                  <xsl:call-template name="GetString">
                    <xsl:with-param name="id">1_4_ValidARP1</xsl:with-param>
                  </xsl:call-template>
                </div>
                <xsl:if test="count(MESSAGES/MESSAGE) &gt;= $scrollBarShowLimit">
                  <ul class="ulMessagesOverflow">
                    <xsl:apply-templates select="MESSAGES">
                      <xsl:with-param name="testIndex" select="$uniqueTstId" />
                    </xsl:apply-templates>
                  </ul>
                </xsl:if>
                <xsl:if test="count(MESSAGES/MESSAGE) &lt; $scrollBarShowLimit">
                  <ul class="ulMessagesNoOverflow">
                    <xsl:apply-templates select="MESSAGES">
                      <xsl:with-param name="testIndex" select="$uniqueTstId" />
                    </xsl:apply-templates>
                  </ul>
                </xsl:if>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_4_Impact</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_4_HowToFix1</xsl:with-param>
                    </xsl:call-template>
                    <br/>
                    <a href="http://go.microsoft.com/fwlink/?LinkId=247354">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">1_4_HowToFix2</xsl:with-param>
                      </xsl:call-template>
                    </a>
                  </span>
                </div>
              </li>
            </xsl:when>
            <xsl:when test="$tstNdx='34'">
              <li>
                <div>
                  <xsl:if test="$tstRslt='WARNING'">
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">TestWarning</xsl:with-param>
                      </xsl:call-template>
                    </span>
                  </xsl:if>
                  <xsl:if test="$tstRslt='FAIL'">
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">TestError</xsl:with-param>
                      </xsl:call-template>
                    </span>
                  </xsl:if>
                  <xsl:call-template name="GetString">
                    <xsl:with-param name="id">1_5_NoPass</xsl:with-param>
                  </xsl:call-template>
                </div>
                <xsl:if test="count(MESSAGES/MESSAGE) &gt;= $scrollBarShowLimit">
                  <ul class="ulMessagesOverflow">
                    <xsl:apply-templates select="MESSAGES">
                      <xsl:with-param name="testIndex" select="$uniqueTstId" />
                    </xsl:apply-templates>
                  </ul>
                </xsl:if>
                <xsl:if test="count(MESSAGES/MESSAGE) &lt; $scrollBarShowLimit">
                  <ul class="ulMessagesNoOverflow">
                    <xsl:apply-templates select="MESSAGES">
                      <xsl:with-param name="testIndex" select="$uniqueTstId" />
                    </xsl:apply-templates>
                  </ul>
                </xsl:if>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">1_5_Impact</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                  </span>
                  <xsl:call-template name="GetString">
                    <xsl:with-param name="id">1_5_HowToFix</xsl:with-param>
                  </xsl:call-template>
                </div>
              </li>
            </xsl:when>
            <xsl:otherwise>
              <div>
                <b>
                  <xsl:call-template name="GetString">
                    <xsl:with-param name="id">NoAdditionalInfo</xsl:with-param>
                  </xsl:call-template>
                </b>
                <xsl:call-template name="GetString">
                  <xsl:with-param name="id">Requirement</xsl:with-param>
                </xsl:call-template>
                <xsl:value-of select="$reqNdx"/>
                <xsl:call-template name="GetString">
                  <xsl:with-param name="id">Test</xsl:with-param>
                </xsl:call-template>
                <xsl:value-of select="$tstNdx"/>
              </div>
              <xsl:if test="count(MESSAGES/MESSAGE) &gt;= $scrollBarShowLimit">
                <ul class="ulMessagesOverflow">
                  <xsl:apply-templates select="MESSAGES">
                    <xsl:with-param name="testIndex" select="$uniqueTstId" />
                  </xsl:apply-templates>
                </ul>
              </xsl:if>
              <xsl:if test="count(MESSAGES/MESSAGE) &lt; $scrollBarShowLimit">
                <ul class="ulMessagesNoOverflow">
                  <xsl:apply-templates select="MESSAGES">
                    <xsl:with-param name="testIndex" select="$uniqueTstId" />
                  </xsl:apply-templates>
                </ul>
              </xsl:if>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:when test="$reqNdx='2'">
          <xsl:choose>
            <xsl:when test="$tstNdx='3'">
              <li>
                <div>
                  <span>
                    <xsl:if test="$tstRslt='WARNING'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestWarning</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="$tstRslt='FAIL'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestError</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">2_1_WrongFolders</xsl:with-param>
                    </xsl:call-template>
                  </span>
                  <xsl:if test="count(MESSAGES/MESSAGE) &gt;= $scrollBarShowLimit">
                    <ul class="ulMessagesOverflow">
                      <xsl:apply-templates select="MESSAGES">
                        <xsl:with-param name="testIndex" select="$uniqueTstId" />
                      </xsl:apply-templates>
                    </ul>
                  </xsl:if>
                  <xsl:if test="count(MESSAGES/MESSAGE) &lt; $scrollBarShowLimit">
                    <ul class="ulMessagesNoOverflow">
                      <xsl:apply-templates select="MESSAGES">
                        <xsl:with-param name="testIndex" select="$uniqueTstId" />
                      </xsl:apply-templates>
                    </ul>
                  </xsl:if>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">Impact</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">2_1_Impact1</xsl:with-param>
                    </xsl:call-template>
                  </span>
                </div>
              </li>
              <li>
                <div>
                  <span>
                    <span class="messageHeading">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">HowToFix</xsl:with-param>
                      </xsl:call-template>
                    </span>
                    <xsl:call-template name="GetString">
                      <xsl:with-param name="id">2_1_HowToFix1</xsl:with-param>
                    </xsl:call-template>
                    <br/>
                    <a href="http://go.microsoft.com/fwlink/?LinkId=331493">
                      <xsl:call-template name="GetString">
                        <xsl:with-param name="id">2_1_HowToFix2</xsl:with-param>
                      </xsl:call-template>
                    </a>
                  </span>
                </div>
              </li>
            </xsl:when>
            <xsl:when test="$tstNdx='7'">
              <li>
                <div>
                  <span>
                    <xsl:if test="$tstRslt='WARNING'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestWarning</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:if test="$tstRslt='FAIL'">
                      <span class="messageHeading">
                        <xsl:call-template name="GetString">
                          <xsl:with-param name="id">TestError</xsl:with-param>
                        </xsl:call-template>
                      </span>
                    </xsl:if>
                    <xsl:call-template name="GetString">
                      <x