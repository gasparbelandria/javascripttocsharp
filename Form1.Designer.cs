namespace WebBrowserScriptTEst
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
                // testing--- and testing
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
        	this.Browser = new System.Windows.Forms.WebBrowser();
        	this.btnOverlay = new System.Windows.Forms.Button();
        	this.textBox1 = new System.Windows.Forms.TextBox();
        	this.SuspendLayout();
        	// 
        	// Browser
        	// 
        	this.Browser.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
			| System.Windows.Forms.AnchorStyles.Left) 
			| System.Windows.Forms.AnchorStyles.Right)));
        	this.Browser.Location = new System.Drawing.Point(1, 40);
        	this.Browser.MinimumSize = new System.Drawing.Size(20, 20);
        	this.Browser.Name = "Browser";
        	this.Browser.Size = new System.Drawing.Size(673, 465);
        	this.Browser.TabIndex = 0;
        	// 
        	// btnOverlay
        	// 
        	this.btnOverlay.Location = new System.Drawing.Point(578, 12);
        	this.btnOverlay.Name = "btnOverlay";
        	this.btnOverlay.Size = new System.Drawing.Size(84, 23);
        	this.btnOverlay.TabIndex = 1;
        	this.btnOverlay.Text = "Overlay";
        	this.btnOverlay.UseVisualStyleBackColor = true;
        	this.btnOverlay.Click += new System.EventHandler(this.btnOverlay_Click);
        	// 
        	// textBox1
        	// 
        	this.textBox1.Location = new System.Drawing.Point(282, 6);
        	this.textBox1.Name = "textBox1";
        	this.textBox1.Size = new System.Drawing.Size(239, 20);
        	this.textBox1.TabIndex = 2;
        	// 
        	// Form1
        	// 
        	this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
        	this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        	this.ClientSize = new System.Drawing.Size(674, 505);
        	this.Controls.Add(this.textBox1);
        	this.Controls.Add(this.btnOverlay);
        	this.Controls.Add(this.Browser);
        	this.Name = "Form1";
        	this.Text = "Form1";
        	this.Load += new System.EventHandler(this.Form1_Load);
        	this.ResumeLayout(false);
        	this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.WebBrowser Browser;
        private System.Windows.Forms.Button btnOverlay;
        private System.Windows.Forms.TextBox textBox1;
    }
}

