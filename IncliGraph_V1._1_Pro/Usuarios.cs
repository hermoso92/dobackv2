using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Reflection;
using System.Resources;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Usuarios : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("ComboBox1")]
	private ComboBox _ComboBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox2")]
	private TextBox _TextBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	private ResourceManager RM;

	private int cancelar;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual ComboBox ComboBox1
	{
		[CompilerGenerated]
		get
		{
			return _ComboBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = ComboBox1_SelectedIndexChanged;
			ComboBox comboBox = _ComboBox1;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged -= value2;
			}
			_ComboBox1 = value;
			comboBox = _ComboBox1;
			if (comboBox != null)
			{
				comboBox.SelectedIndexChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
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
			EventHandler value2 = TextBox2_TextChanged;
			TextBox textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.TextChanged -= value2;
			}
			_TextBox2 = value;
			textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.TextChanged += value2;
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

	public Usuarios()
	{
		base.FormClosing += Usuarios_FormClosing;
		base.Load += Usuarios_Load;
		RM = new ResourceManager("IncliGraph_V1._1_Pro.frases", Assembly.GetExecutingAssembly());
		cancelar = 1;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Usuarios));
		this.Label1 = new System.Windows.Forms.Label();
		this.ComboBox1 = new System.Windows.Forms.ComboBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.GroupBox1.SuspendLayout();
		base.SuspendLayout();
		resources.ApplyResources(this.Label1, "Label1");
		this.Label1.Name = "Label1";
		resources.ApplyResources(this.ComboBox1, "ComboBox1");
		this.ComboBox1.FormattingEnabled = true;
		this.ComboBox1.Items.AddRange(new object[2]
		{
			resources.GetString("ComboBox1.Items"),
			resources.GetString("ComboBox1.Items1")
		});
		this.ComboBox1.Name = "ComboBox1";
		resources.ApplyResources(this.Label2, "Label2");
		this.Label2.Name = "Label2";
		resources.ApplyResources(this.TextBox1, "TextBox1");
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.UseSystemPasswordChar = true;
		resources.ApplyResources(this.GroupBox1, "GroupBox1");
		this.GroupBox1.Controls.Add(this.TextBox2);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.TabStop = false;
		resources.ApplyResources(this.TextBox2, "TextBox2");
		this.TextBox2.BackColor = System.Drawing.SystemColors.Control;
		this.TextBox2.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.ReadOnly = true;
		resources.ApplyResources(this.Button1, "Button1");
		this.Button1.Name = "Button1";
		this.Button1.UseVisualStyleBackColor = true;
		resources.ApplyResources(this.Button2, "Button2");
		this.Button2.Name = "Button2";
		this.Button2.UseVisualStyleBackColor = true;
		base.AcceptButton = this.Button1;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.ComboBox1);
		base.Controls.Add(this.Label2);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Usuarios";
		base.ShowIcon = false;
		base.TopMost = true;
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Usuarios_FormClosing(object sender, FormClosingEventArgs e)
	{
		if (cancelar == 1)
		{
			MyProject.Forms.Principal.user = 2;
			Interaction.MsgBox(RM.GetString("mensajeacceso"), MsgBoxStyle.OkOnly, "IncliSoft VEXT-IS1");
		}
		MyProject.Forms.Principal.Enabled = true;
	}

	private void Usuarios_Load(object sender, EventArgs e)
	{
		ComboBox1.SelectedIndex = 0;
	}

	private void ComboBox1_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (ComboBox1.SelectedIndex == 0)
		{
			TextBox1.Text = "";
			TextBox1.ReadOnly = true;
			TextBox2.Text = RM.GetString("permisosololectura");
		}
		else
		{
			ComboBox1.SelectedIndex = 1;
			TextBox1.Text = "";
			TextBox1.ReadOnly = false;
			TextBox2.Text = RM.GetString("permisocompleto");
		}
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		bool flag = false;
		if (ComboBox1.SelectedIndex == 0)
		{
			MyProject.Forms.Principal.user = 2;
			cancelar = 0;
			Close();
			return;
		}
		if (Operators.CompareString(TextBox1.Text, MyProject.Forms.Principal.UsersDataSet.users[ComboBox1.SelectedIndex].clave, TextCompare: false) == 0)
		{
			flag = true;
		}
		if (flag)
		{
			if (ComboBox1.SelectedIndex == 0)
			{
				MyProject.Forms.Principal.user = 2;
			}
			else
			{
				ComboBox1.SelectedIndex = 1;
				MyProject.Forms.Principal.user = 1;
			}
			cancelar = 0;
			Close();
		}
		else
		{
			Interaction.MsgBox(RM.GetString("contraseñaincorrecta"), MsgBoxStyle.OkOnly, "IncliSoft VEXT-IS1");
		}
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void TextBox2_TextChanged(object sender, EventArgs e)
	{
	}
}
