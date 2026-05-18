ress" type="xs:string" use="required" />
                                    <xs:attribute name="maxconnection" type="xs:int" use="required" />
                                    <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockElements" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                            <xs:element name="remove" vs:help="configuration/system.net/connectionManagement/remove">
                                <xs:complexType>
                                    <xs:attribute name="address" type="xs:string" use="required" />
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                            <xs:element name="clear" vs:help="configuration/system.net/connectionManagement/clear">
                                <xs:complexType>
                                    <!--tag is empty-->
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                        </xs:choice>
                        <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                        <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                        <xs:attribute name="lockElements" type="xs:string" use="optional" />
                        <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                        <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                        <xs:attribute name="configSource" type="xs:string" use="optional" />
                        <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                    </xs:complexType>
                </xs:element>
                <xs:element name="defaultProxy" vs:help="configuration/system.net/defaultProxy">
                    <xs:complexType>
                        <xs:choice minOccurs="0" maxOccurs="unbounded">
                            <xs:element name="bypasslist" vs:help="configuration/system.net/defaultProxy/bypasslist">
                                <xs:complexType>
                                    <xs:choice minOccurs="0" maxOccurs="unbounded">
                                        <xs:element name="add" vs:help="configuration/system.net/defaultProxy/bypasslist/add">
                                            <xs:complexType>
                                                <xs:attribute name="address" type="xs:string" use="required" />
                                                <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                                                <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                                                <xs:attribute name="lockElements" type="xs:string" use="optional" />
                                                <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                                                <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                                                <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                            </xs:complexType>
                                        </xs:element>
                                        <xs:element name="remove" vs:help="configuration/system.net/defaultProxy/bypasslist/remove">
                                            <xs:complexType>
                                                <xs:attribute name="address" type="xs:string" use="required" />
                                                <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                            </xs:complexType>
                                        </xs:element>
                                        <xs:element name="clear" vs:help="configuration/system.net/defaultProxy/bypasslist/clear">
                                            <xs:complexType>
                                                <!--tag is empty-->
                                                <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                            </xs:complexType>
                                        </xs:element>
                                    </xs:choice>
                                    <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockElements" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                            <xs:element name="module" vs:help="configuration/system.net/defaultProxy/module">
                                <xs:complexType>
                                    <xs:attribute name="type" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockElements" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                            <xs:element name="proxy" vs:help="configuration/system.net/defaultProxy/proxy">
                                <xs:complexType>
                                    <xs:attribute name="autoDetect" use="optional">
                                        <xs:simpleType>
                                            <xs:restriction base="xs:NMTOKEN">
                                                <xs:enumeration value="False" />
                                                <xs:enumeration value="True" />
                                                <xs:enumeration value="Unspecified" />
                                            </xs:restriction>
                                        </xs:simpleType>
                                    </xs:attribute>
                                    <xs:attribute name="bypassonlocal" use="optional">
                                        <xs:simpleType>
                                            <xs:restriction base="xs:NMTOKEN">
                                                <xs:enumeration value="False" />
                                                <xs:enumeration value="True" />
                                                <xs:enumeration value="Unspecified" />
                                            </xs:restriction>
                                        </xs:simpleType>
                                    </xs:attribute>
                                    <xs:attribute name="proxyaddress" type="xs:string" use="optional" />
                                    <xs:attribute name="scriptLocation" type="xs:string" use="optional" />
                                    <xs:attribute name="usesystemdefault" use="optional">
                                        <xs:simpleType>
                                            <xs:restriction base="xs:NMTOKEN">
                                                <xs:enumeration value="False" />
                                                <xs:enumeration value="True" />
                                                <xs:enumeration value="Unspecified" />
                                            </xs:restriction>
                                        </xs:simpleType>
                                    </xs:attribute>
                                    <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockElements" type="xs:string" use="optional" />
                                    <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                                    <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                                    <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                                </xs:complexType>
                            </xs:element>
                        </xs:choice>
                        <xs:attribute name="enabled" type="small_boolean_Type" use="optional" />
                        <xs:attribute name="useDefaultCredentials" type="small_boolean_Type" use="optional" />
                        <xs:attribute name="lockAttributes" type="xs:string" use="optional" />
                        <xs:attribute name="lockAllAttributesExcept" type="xs:string" use="optional" />
                        <xs:attribute name="lockElements" type="xs:string" use="optional" />
                        <xs:attribute name="lockAllElementsExcept" type="xs:string" use="optional" />
                        <xs:attribute name="lockItem" type="small_boolean_Type" use="optional" />
                        <xs:attribute name="configSource" type="xs:string" use="optional" />
                        <xs:anyAttribute namespace="http://schemas.microsoft.com/XML-Document-Transform" processContents="strict"/>
                    </xs:complexType>
                </xs:element>
                <xs:element name="requestCaching" vs:help="configuration/system.net/requestCaching">
                    <xs:complexType>
                        <xs:choice minOccurs="0" maxOccurs="unbounded">
                            <xs:element name="defaultFtpCachePolicy" vs:help="configuration/system.net/requestCaching/defaultFtpCachePolicy">
                                <xs:complexType>
                                    <xs:attribute name="policyLevel" use="optional">
                                        <xs:simpleType>
                                            <xs:restriction base="xs:NMTOKEN">
                                                <xs:enumeration value="BypassCache" />
                                                <xs:enumeration value="CacheIfAvailable" />
                                                <xs:enumeration value="CacheOnly" />
                                                <xs:enumeration value="Default" />
                                                <xs:enumeration value="NoCacheNoStore" />
                                                <xs:enumeration value="Reload" />
                                                <xs:enumeration value="Revalidate" />
                                            </xs:restriction>
                                        </xs:simpleType>
                                   