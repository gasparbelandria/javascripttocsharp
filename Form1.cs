using System;
using System.Collections.Generic;
using System.ComponentModel;

using System.Drawing;
using System.Text;
using System.Windows.Forms;
using Newtonsoft.Json.Linq;
using Westwind.Tools;
using System.IO;
using System.Security.Permissions;
using Newtonsoft.Json;

namespace WebBrowserScriptTEst
{
	[PermissionSet(SecurityAction.Demand, Name="FullTrust")]
	[System.Runtime.InteropServices.ComVisibleAttribute(true)]
    public partial class Form1 : Form
    {

    	public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // *** Assumes the Html page is in a .\html folder beneath the EXE
            string htmlPage = Path.GetFullPath(@".\html\_preview.htm");
            this.Browser.Navigate(htmlPage);
            this.Browser.ObjectForScripting = this;
        }
        public void cShowMessage(object obj){
        	Product[] Parray = JsonConvert.DeserializeObject<Product[]>(obj.ToString());
        	
        	string result = string.Empty;
        	foreach(Product pt in Parray){
        		result +=  Environment.NewLine + string.Format("Name:{0},Expiry:{1},Price:{2}",pt.Name,pt.Expiry,pt.Price);
        	}
        	MessageBox.Show(result);
        	
        }
        private void btnOverlay_Click(object sender, EventArgs e)
        {   
            // *** Call the JavaScript function and capture the result value
            object result = this.CallJavascriptFunction("JavascriptShowMessage",textBox1.Text);
           
        }

        private object CallJavascriptFunction(string function,params object[] parms)
        {
            // *** Get the COM DOM object (not the .NET Wrapper)
            object doc = this.Browser.Document.DomDocument;

            // *** Now you can use Reflection on the COM DOM
            object win = wwUtils.GetPropertyCom(doc, "parentWindow");
            
            // *** Call the JavaScript function and capture the result value
            object result = wwUtils.CallMethodCom(win, function, parms);

            return result;
        }
        

    }
    public class Product{
    	public string Name {get;set;}
    	public string Expiry {get;set;}
    	public string Price {get;set;}
    }
}

