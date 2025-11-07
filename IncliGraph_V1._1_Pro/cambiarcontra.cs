using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class cambiarcontra : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox1")]
	private TextBox _TextBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox2")]
	private TextBox _TextBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox3")]
	private TextBox _TextBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	private ResourceManager RM;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox1
	{
		[CompilerGenerated]
		get
		{
			return _TextBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox1_KeyPress;
			TextBox textBox = _TextBox1;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox1 = value;
			textBox = _TextBox1;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox2
	{
		[CompilerGenerated]
		get
		{
			return _TextBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox2_KeyPress;
			TextBox textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox2 = value;
			textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox3
	{
		[CompilerGenerated]
		get
		{
			return _TextBox3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox3_KeyPress;
			TextBox textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox3 = value;
			textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button2
	{
		[CompilerGenerated]
		get
		{
			return _Button2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button2_Click;
			Button button = _Button2;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button2 = value;
			button = _Button2;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public cambiarcontra()
	{
		base.Load += cambiarcontra_Load;
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager componentResourceManager = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.cambiarcontra));
		this.Label1 = new System.Windows.Forms.Label();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label3 = new System.Windows.Forms.Label();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.Label4 = new System.Windows.Forms.Label();
		this.GroupBox1.SuspendLayout();
		base.SuspendLayout();
		componentResourceManager.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		componentResourceManager.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.UseSystemPasswordChar = true;
		componentResourceManager.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		componentResourceManager.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.UseSystemPasswordChar = true;
		componentResourceManager.ApplyResources(this.Label3, "Label3");
		this.Label3.Name = "Label3";
		componentResourceManager.ApplyResources(this.TextBox3, "TextBox3");
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.UseSystemPasswordChar = true;
		componentResourceManager.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		componentResourceManager.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Controls.Add(this.TextBox1);
		this.GroupBox1.Controls.Add(this.Label1);
		this.GroupBox1.Controls.Add(this.Label2);
		this.GroupBox1.Controls.Add(this.TextBox3);
		this.GroupBox1.Controls.Add(this.TextBox2);
		this.GroupBox1.Controls.Add(this.Label3);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		componentResourceManager.ApplyResources(this.Label4, "Label4");
		this.Label4.Name = "Label4";
		componentResourceManager.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Label4);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.Name = "cambiarcontra";
		base.ShowIcon = false;
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void cambiarcontra_Load(object sender, EventArgs e)
	{
	}

	private void TextBox1_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar == Convert.ToChar(44)) | (e.KeyChar == Convert.ToChar(46)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(90)) & (e.KeyChar >= Convert.ToChar(65)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(122)) & (e.KeyChar >= Convert.ToChar(97)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox2_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar == Convert.ToChar(44)) | (e.KeyChar == Convert.ToChar(46)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(90)) & (e.KeyChar >= Convert.ToChar(65)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(122)) & (e.KeyChar >= Convert.ToChar(97)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox3_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar == Convert.ToChar(44)) | (e.KeyChar == Convert.ToChar(46)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(90)) & (e.KeyChar >= Convert.ToChar(65)))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(122)) & (e.KeyChar >= Convert.ToChar(97)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		if (Operators.CompareString(TextBox1.Text, MyProject.Forms.Principal.UsersDataSet.users[MyProject.Forms.Principal.user].clave, TextCompare: false) == 0)
		{
			if (Operators.CompareString(TextBox2.Text, TextBox3.Text, TextCompare: false) == 0)
			{
				MyProject.Forms.Principal.UsersDataSet.users[MyProject.Forms.Principal.user].clave = TextBox2.Text;
				MyProject.Forms.Principal.Validate();
				MyProject.Forms.Principal.UsersBindingSource.EndEdit();
				MyProject.Forms.Principal.UsersTableAdapter.Update(MyProject.Forms.Principal.UsersDataSet.users);
				Close();
			}
			else
			{
				Interaction.MsgBox(RM.GetString("errorpassword1"), MsgBoxStyle.OkOnly, "IncliSoft VEXT-IS1");
			}
		}
		else
		{
			Interaction.MsgBox(RM.GetString("errorpassword2"), MsgBoxStyle.OkOnly, "IncliSoft VEXT-IS1");
		}
	}
}
